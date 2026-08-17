import { tool, type UIMessage } from 'ai';
import { intakeStateSchema, leadSchema } from './intake-schema';
import { budgetLabel } from '../../lib/budget';
import { sendLeadEmails } from '../email/lead';
import { checkContactRateLimit } from './rate-limit';

/**
 * Records what the assistant understood. It has no side effect on purpose: its
 * whole value is that the result lands in the message history, so the next turn
 * sees the assistant's own typed commitments instead of re-reading prose.
 */
export const updateIntakeTool = tool({
  description:
    'Record or CORRECT what you understood about the project. Call this every time the visitor tells you something new, and again the moment their words contradict what you recorded before — the visitor\'s latest words always win.',
  inputSchema: intakeStateSchema,
  execute: async (state) => state,
});

/**
 * The transcript is built here rather than taken as a tool argument. The route
 * already holds the real history, so the studio receives the conversation as it
 * actually stands — a model-supplied copy is how the previous design lost every
 * message after the fourth. `parts` can be absent on a message shape the SDK
 * still allows, which is why `chat.ts` itself defaults it to `[]` — this does
 * the same.
 */
export function transcriptOf(messages: UIMessage[]): string {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const text = (m.parts ?? [])
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text ?? '')
        .join('');
      return text ? `${m.role === 'user' ? 'Visitante' : 'IA'}: ${text}` : '';
    })
    .filter(Boolean)
    .join('\n');
}

/** Idempotency guard: a completed submitLead result already in the history. */
export function hasSubmittedLead(messages: UIMessage[]): boolean {
  return messages.some((m) =>
    m.parts?.some(
      (p: any) => p.type === 'tool-submitLead' && p.state === 'output-available' && p.output?.sent,
    ),
  );
}

/**
 * Closes the lead. The only tool in this file with a side effect, so every guard
 * runs before `sendLeadEmails` is touched:
 *
 * 1. Idempotency — against the real history (`hasSubmittedLead`, covers repeat
 *    requests) AND against a per-request flag (`claimedThisRequest`, covers the
 *    same request: `stopWhen: isStepCount(5)` leaves room for several tool calls,
 *    and the AI SDK can run parallel tool calls from one assistant step
 *    concurrently — two `submitLead` calls in the same step would each see a
 *    clean, unchanged `opts.messages` and neither would notice the other).
 * 2. Schema validation — cheap and I/O-free, so it runs before the rate limiter
 *    spends one of its 5-per-hour tokens on input that was never going to mail.
 * 3. The CONTACT rate limiter (stricter than the chat one, because this is the
 *    path that sends mail).
 * 4. `sendLeadEmails` itself, wrapped: a syntactically valid but undeliverable
 *    visitor address can reject the confirmation half of its `Promise.all` after
 *    the owner mail already went out, and an uncaught rejection here would leave
 *    `execute` throwing — which the AI SDK turns into an `output-error` part with
 *    no `output` field, dropping this tool's result out of the contract Task 6
 *    reads. Catching keeps every outcome inside `{ sent, reason? }`.
 */
export function createSubmitLeadTool(opts: { messages: UIMessage[]; ip: string }) {
  let claimedThisRequest = false;

  return tool({
    description:
      'Send the lead to the studio. Call this ONLY once you have their name, their email, and their budget situation, and after you have summarized the project back to them. Never call it earlier.',
    inputSchema: leadSchema,
    execute: async (input) => {
      if (hasSubmittedLead(opts.messages) || claimedThisRequest) {
        return { sent: false, reason: 'already_sent' as const };
      }

      // Defense-in-depth: the AI SDK already validates a model's tool call against
      // `inputSchema` before `execute` runs in production, but `execute` itself is
      // exported and directly callable by any code that gets a handle on this
      // tool — re-validating here keeps the mailer unreachable on malformed input
      // regardless of how `execute` was invoked, at no I/O cost.
      const parsed = leadSchema.safeParse(input);
      if (!parsed.success) {
        return { sent: false, reason: 'invalid_input' as const };
      }

      // Claimed here, synchronously and before the first `await` below: whichever
      // of two concurrently-dispatched `submitLead` calls reaches this line first
      // sets the flag before yielding, so the other sees it already claimed the
      // next time it checks (at the top of its own `execute` call) instead of both
      // racing past the rate limiter and mailing twice.
      claimedThisRequest = true;

      const { success } = await checkContactRateLimit(opts.ip);
      if (!success) {
        return { sent: false, reason: 'rate_limited' as const };
      }

      try {
        await sendLeadEmails({
          name: parsed.data.name,
          email: parsed.data.email,
          subject: 'Lead desde la IA',
          budget: budgetLabel(parsed.data.budget, parsed.data.language),
          message: `${parsed.data.summary}\n\nConversación de intake:\n\n${transcriptOf(opts.messages)}`,
          language: parsed.data.language,
        });
      } catch (error) {
        console.error('submitLead: sendLeadEmails failed', error);
        return { sent: false, reason: 'send_failed' as const };
      }

      return { sent: true as const };
    },
  });
}
