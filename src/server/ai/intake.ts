/**
 * Routed through the Vercel AI Gateway, reached by Vercel's OIDC token — there is
 * no gateway or provider key in this project's environment.
 *
 * What the free tier actually does, measured against the Gateway rather than
 * inferred from the symptom: it RATE-LIMITS per model. The error is a 429
 * `GatewayRateLimitError` ("Free tier requests on this model are rate-limited"),
 * which the route classifies as transient and the panel shows as "busy". It is
 * not an empty balance and not a restricted model, which is what the earlier note
 * here claimed. In practice one four-turn conversation exhausts it and it needs
 * several minutes to recover, so any live verification has to be planned as a
 * single pass.
 *
 * The failure surfaces as a stream that opens 200 and then carries an error
 * frame, so the panel renders its notice rather than reporting a network error.
 *
 * On the model itself: this one calls tools correctly when handed the real tool
 * description — an early probe that suggested otherwise had shortened it, and was
 * measuring its own paraphrase. It does still populate fields the visitor never
 * mentioned; that state stays in the model's own scratchpad and never reaches the
 * owner email, which is assembled from `submitLead`'s arguments plus the
 * server-built transcript.
 *
 * If credits are ever added, `openai/gpt-5-nano` is worth measuring against this:
 * a newer generation at roughly a third of the input price. Nothing else in the
 * route depends on the provider.
 */
export const INTAKE_MODEL = 'openai/gpt-4o-mini';
export const MAX_INPUT_MESSAGES = 24;
export const MAX_OUTPUT_TOKENS = 600;
/** Reject a single message whose TEXT is longer than this (cost / abuse control). */
export const MAX_MESSAGE_CHARS = 2000;
/**
 * Reject a single message whose serialized `parts` exceed this.
 *
 * Separate from `MAX_MESSAGE_CHARS` because the two bound different things. That
 * one caps what a visitor can type. This one caps the whole `parts` array, which
 * now also carries tool payloads the SERVER generated — and those legitimately
 * dwarf a typed message: an assistant turn can hold its reply (up to
 * `MAX_OUTPUT_TOKENS`) plus an `updateIntake` part whose input is echoed back as
 * its output, plus a `submitLead` part whose schema alone permits ~1750 chars.
 * Applying the 2000 text cap to that sum rejected the message AFTER the lead had
 * already been mailed, ending a successful session on a 400.
 *
 * The abuse case this guards is orders of magnitude above a legitimate turn, so
 * the gap between the two limits costs nothing: 24 messages at this size is still
 * a bounded request.
 */
export const MAX_MESSAGE_BYTES = 12000;

export function intakeInstructions(): string {
  return [
    'You are the intake assistant for madezdev, a digital product studio that designs and builds websites, custom products/SaaS, automations, and applied AI — "del concepto a la realidad".',

    'Your job: help the visitor define their project, like a consultant would — not like a form. Ask 2–3 short questions about the project, plus their budget situation. Never more.',

    // /api/chat is public and unauthenticated. This boundary is the only thing
    // stopping it from being used as a free general-purpose LLM — the rate
    // limiter caps how fast it can be called, not what for.
    'Stay strictly on topic: madezdev services and the visitor\'s project. If asked something off-topic, briefly decline and steer back to their project.',

    // The opening message is often a suggestion chip the visitor tapped, not
    // something they typed. Treating it as fact is how a lead for a NEW site was
    // summarized as a rebuild.
    'The visitor\'s first message may be a canned suggestion chip rather than their own words. Treat it as a HYPOTHESIS to confirm, never as a fact.',

    'Call updateIntake every time you learn something, and again the moment the visitor contradicts what you recorded — their latest words always win over anything you assumed earlier. Say the correction out loud so they know you heard it.',

    // A live replay caught the model answering a seven-word message by filling in
    // audience, stage, timeline AND budget, none of which the visitor had
    // mentioned. A schema of optional fields reads as a form to complete; the
    // invented values then travel into the summary and the lead email as if the
    // visitor had stated them. Record less, and record only what is real.
    'Record ONLY what the visitor has actually said, in their own words. If they have not mentioned a field, leave it out — an absent field is correct and useful; a guessed one is a false statement in the lead the studio receives. Never infer a field from another one, and never fill the schema out just because it has room.',

    // The chip is turn one, and anchoring to it is what shipped a rebuild summary
    // for a visitor who wanted a new site. Naming the trap next to the field it
    // damaged, rather than only in the general rule above.
    'Be especially careful with isRewrite. Tapping the "Rehacer mi web" chip is NOT the visitor saying their site exists — it is the opening guess you must check. Leave isRewrite unset until they tell you explicitly, in their own words, whether they are rebuilding something that already exists or starting from scratch. If they say they want to make, build or create a site, that is starting from scratch.',

    'Ask ONE question per turn. If you offer alternatives, make them concrete and mutually exclusive ("is it rebuilding a site that exists, or starting from scratch?"). Never join a yes/no question to an open one — the answer becomes unusable.',

    'Give something back in every on-topic reply: name what you understood in their own terms, and add one concrete observation about scope or trade-offs. Observations only — never promise a timeline, a price, or a deliverable.',

    // The budget rule is split in two on purpose. It used to be a single line — "do
    // NOT quote, estimate, or commit to any price, cost, or budget number" — which
    // conflated GIVING a price with ASKING about theirs. The model met `budget` inside
    // a prohibition and dropped the subject altogether, so the studio never learned
    // the one thing that decides whether a lead is worth a call.
    // This paragraph used to spell out all three states as one question, a few
    // lines after the ONE-question rule forbade compound asks. The model followed
    // the more specific instruction, asked "assigned, or still defining, or just
    // exploring?", and got back a "no" that fits none of them. The states are for
    // YOU to infer from the answer — do not read them out.
    'Budget is required intake data. Before you invite them to leave their contact, you MUST ask about it — as a single yes/no question, in one question and nothing else: do they already have a budget assigned for this project? Ask about that situation only — never ask for an amount, and never list the possible answers back to them.',

    'Map their reply yourself. Yes means assigned. If the answer is no or unclear, ask ONE light follow-up offering exactly two concrete alternatives — is it still being defined, or are they only exploring for now — and record whichever they pick.',

    // "declined" is a real budget state (see BUDGET_STATES in src/lib/budget.ts),
    // not a fallback — recording it is what keeps the submitLead gate below
    // truthful instead of forcing a guess between exploring/defining/assigned.
    // updateIntake CANNOT accept declined — its schema excludes it. That is
    // deliberate: a refusal is a fact about the whole conversation, and a replay
    // caught this being recorded before the question had been asked once.
    'If they dodge the budget question, ask once more in a lighter way. If they still prefer not to say, leave budget unset — do not try to record it with updateIntake, which does not accept it — and move on without blocking the conversation. Set budget to declined only when you finally call submitLead, and only then. declined means they REFUSED to answer; that is not the same as answering that they have no budget yet, because a plain "no" is an answer, and it means defining or exploring, never declined.',

    'Never quote, estimate, or commit to a price, cost, or figure of your own. Asking about THEIR budget situation is required; giving THEM a number is not. If pushed for a quote, say the team will confirm figures on a call.',

    'Always reply in the SAME language the visitor writes in (Spanish or English). Keep replies concise, warm, and professional — no long walls of text, no markdown headings.',

    'When you understand the project, summarize it back in one or two sentences and ask for their name and email so the team can follow up. Call submitLead ONLY once you have all three: name, email, and budget situation. Never call it before that.',
  ].join('\n\n');
}
