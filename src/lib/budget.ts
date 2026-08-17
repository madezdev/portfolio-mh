/**
 * Budget qualification for the AI intake.
 *
 * Deliberately states, not amounts. The studio needs to know whether the money
 * exists before the team invests a call in the lead — how much it is comes later,
 * on that call. Keeping figures out of the picker also means the assistant's
 * "never quote a price" rule stays intact: there is no number anywhere to anchor to.
 *
 * The <select> in StudioAI renders straight from this list, and the labels live in
 * i18n keyed by these ids, so both sides move together.
 */
export const BUDGET_STATES = ['assigned', 'defining', 'exploring'] as const;

export type BudgetState = (typeof BUDGET_STATES)[number];
