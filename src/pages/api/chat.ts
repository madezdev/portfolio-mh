import type { APIRoute } from 'astro';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { intakeInstructions, INTAKE_MODEL, MAX_INPUT_MESSAGES, MAX_MESSAGE_CHARS, MAX_OUTPUT_TOKENS } from '../../server/ai/intake';
import { checkRateLimit } from '../../server/ai/rate-limit';
import { getClientIp } from '../../server/security';

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
  const tooLong = messages.some(
    (m) => (m.parts ?? []).reduce((n, p) => n + ('text' in p && typeof p.text === 'string' ? p.text.length : 0), 0) > MAX_MESSAGE_CHARS,
  );
  if (tooLong) {
    return new Response(JSON.stringify({ error: 'too_long' }), { status: 400 });
  }

  const { success } = await checkRateLimit(getClientIp(request));
  if (!success) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  }

  try {
    const result = streamText({
      model: INTAKE_MODEL,
      instructions: intakeInstructions(),
      messages: await convertToModelMessages(messages),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
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
