import type { APIRoute } from 'astro';
import { convertToModelMessages, isStepCount, streamText, type UIMessage } from 'ai';
import { intakeInstructions, INTAKE_MODEL, MAX_INPUT_MESSAGES, MAX_MESSAGE_CHARS, MAX_OUTPUT_TOKENS } from '../../server/ai/intake';
import { checkRateLimit } from '../../server/ai/rate-limit';
import { getClientIp } from '../../server/security';
import { createSubmitLeadTool, updateIntakeTool } from '../../server/ai/tools';
import { SUBMIT_LEAD_TOOL } from '../../lib/ai-tools';

/**
 * Registers the tools under the shared name contract (`src/lib/ai-tools.ts`)
 * rather than a literal object key. `hasSubmittedLead` (server) and `leadSent`
 * (client) both key off the same constant — a hardcoded literal here is exactly
 * how a rename previously broke both without failing a single test.
 */
export function buildChatTools(opts: { messages: UIMessage[]; ip: string }) {
  return {
    updateIntake: updateIntakeTool,
    [SUBMIT_LEAD_TOOL]: createSubmitLeadTool(opts),
  };
}

/**
 * True when a single message's `parts` serialize to more than `MAX_MESSAGE_CHARS`.
 *
 * Counting only `text` parts was complete coverage before this branch — `parts`
 * carried nothing else. Now the history legitimately carries `tool-updateIntake`
 * / `tool-submitLead` parts whose `input`/`output` are arbitrary JSON, and
 * `convertToModelMessages` round-trips that JSON straight into the prompt sent to
 * the model. `messages` is client-supplied and this route is unauthenticated, so
 * bounding text alone left a caller free to post `MAX_INPUT_MESSAGES` worth of
 * huge tool payloads and pay nothing against the cap, at 10 req/min against a
 * paid model. Serializing the whole `parts` array bounds every shape parts can
 * take, not just the one that existed when the cap was written.
 */
export function isMessageTooLong(m: UIMessage): boolean {
  return JSON.stringify(m.parts ?? []).length > MAX_MESSAGE_CHARS;
}

/**
 * Whether the provider failed in a way that a retry a moment later could clear.
 *
 * The real status is always nested. The SDK retries internally and then throws a
 * `RetryError`, whose own name and shape say nothing about why the call failed —
 * and it carries the original on `lastError`/`errors`, NOT on `cause`. Walking
 * only `cause` would miss every rate limit, which is the case this exists for.
 */
export function isTransient(error: unknown): boolean {
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length) {
    const e = queue.shift();
    if (!e || typeof e !== 'object' || seen.has(e)) continue;
    seen.add(e);

    const { name, statusCode, cause, lastError, errors } = e as {
      name?: string;
      statusCode?: number;
      cause?: unknown;
      lastError?: unknown;
      errors?: unknown[];
    };

    if (statusCode === 429 || statusCode === 503) return true;
    if (name && /RateLimit|Overloaded|Timeout|ServiceUnavailable/i.test(name)) return true;

    queue.push(cause, lastError, ...(Array.isArray(errors) ? errors : []));
  }

  return false;
}

export const POST: APIRoute = async ({ request }) => {
  let messages: UIMessage[];
  try {
    ({ messages } = (await request.json()) as { messages: UIMessage[] });
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400 });
  }
  if (messages.length > MAX_INPUT_MESSAGES) {
    return new Response(JSON.stringify({ error: 'too_long' }), { status: 400 });
  }
  if (messages.some(isMessageTooLong)) {
    return new Response(JSON.stringify({ error: 'too_long' }), { status: 400 });
  }

  const ip = getClientIp(request);
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  }

  try {
    const result = streamText({
      model: INTAKE_MODEL,
      instructions: intakeInstructions(),
      messages: await convertToModelMessages(messages),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      tools: buildChatTools({ messages, ip }),
      // Without stopWhen the model stops after the tool call and never produces the
      // reply that follows it — the panel would go silent every time it records
      // something. 5 leaves room for a record plus the spoken turn.
      stopWhen: isStepCount(5),
    });
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('AI chat stream error:', error);
        // The client shows a different notice for each: one is worth retrying in a
        // moment, the other is not. Collapsing both into `ai_unavailable` told a
        // visitor the assistant was down when the provider had merely throttled a
        // burst — the common case on this account's tier.
        return isTransient(error) ? 'ai_busy' : 'ai_unavailable';
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'ai_unavailable' }), { status: 503 });
  }
};
