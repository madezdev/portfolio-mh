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
 * message after the fourth.
 */
export function transcriptOf(messages: UIMessage[]): string {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const text = m.parts
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
 * Closes the lead. The only tool in this file with a side effect, so every
 * guard runs before `sendLeadEmails` is touched: idempotency against the real
 * history, then the CONTACT rate limiter (stricter than the chat one, because
 * this is the path that sends mail), then schema validation via `inputSchema`.
 */
export function createSubmitLeadTool(opts: { messages: UIMessage[]; ip: string }) {
  return tool({
    description:
      'Send the lead to the studio. Call this ONLY once you have their name, their email, and their budget situation, and after you have summarized the project back to them. Never call it earlier.',
    inputSchema: leadSchema,
    execute: async (input) => {
      if (hasSubmittedLead(opts.messages)) {
        return { sent: false, reason: 'already_sent' as const };
      }
      const { success } = await checkContactRateLimit(opts.ip);
      if (!success) {
        return { sent: false, reason: 'rate_limited' as const };
      }
      // Belt and braces: `inputSchema` already has the AI SDK validate the model's
      // tool call before `execute` runs, but `execute` is a plain function reachable
      // by any caller — re-validating here means the mailer is never touched on
      // malformed input regardless of how `execute` was invoked.
      const parsed = leadSchema.safeParse(input);
      if (!parsed.success) {
        return { sent: false, reason: 'invalid_input' as const };
      }
      await sendLeadEmails({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: 'Lead desde la IA',
        budget: budgetLabel(parsed.data.budget, parsed.data.language),
        message: `${parsed.data.summary}\n\nConversación de intake:\n\n${transcriptOf(opts.messages)}`,
        language: parsed.data.language,
      });
      return { sent: true as const };
    },
  });
}
