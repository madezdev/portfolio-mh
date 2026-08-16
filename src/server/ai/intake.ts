/**
 * Routed through the Vercel AI Gateway. `anthropic/claude-haiku-4.5` was the first
 * choice but the Gateway rejects it with 403 `RestrictedModelsError` — that model is
 * gated behind paid credits, and this account has none. The failure surfaces as a
 * stream that opens 200 and then carries an error frame, so the panel renders its
 * fallback rather than reporting a network error.
 *
 * This one is reachable on the free tier and was checked against the Gateway directly.
 * Switch back to Claude Haiku here the moment the account has credits; nothing else
 * in the route depends on the provider.
 */
export const INTAKE_MODEL = 'openai/gpt-4o-mini';
export const MAX_INPUT_MESSAGES = 24;
export const MAX_OUTPUT_TOKENS = 600;
/** Reject a single message longer than this (cost / abuse control). */
export const MAX_MESSAGE_CHARS = 2000;

export function intakeInstructions(): string {
  return [
    'You are the intake assistant for madezdev, a digital product studio that designs and builds websites, custom products/SaaS, automations, and applied AI — "del concepto a la realidad".',
    'Your job: help the visitor define their project. Ask 2–4 short, smart qualifying questions, one or two at a time: what they need, who it is for, what stage they are at, and their rough timeline.',
    'Stay strictly on topic: madezdev services and the visitor\'s project. If asked something off-topic, briefly decline and steer back to their project.',
    'Do NOT quote, estimate, or commit to any price, cost, or budget number. If pushed on price, say the team will discuss it on a call.',
    'Always reply in the SAME language the visitor writes in (Spanish or English). Keep replies concise, warm, and professional — no long walls of text, no markdown headings.',
    'Once you have enough signal about the project, briefly summarize what you understood in one or two sentences and invite them to leave their name and email (or book a call) so the team can follow up.',
  ].join('\n\n');
}
