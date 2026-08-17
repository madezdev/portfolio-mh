import { translations, type Language } from '../i18n/translations';

/**
 * Budget qualification for the AI intake.
 *
 * Deliberately states, not amounts. The studio needs to know whether the money
 * exists before the team invests a call in the lead — how much it is comes later,
 * on that call. Keeping figures out of the picker also means the assistant's
 * "never quote a price" rule stays intact: there is no number anywhere to anchor to.
 *
 * The Zod schema (`src/server/ai/intake-schema.ts`) builds its enum straight from
 * this list, and the labels live in i18n keyed by these ids, so schema and copy
 * move together.
 *
 * `declined` is distinct from `exploring`: it means the visitor was asked twice
 * and chose not to answer, not that they have no budget yet. Collapsing the two
 * would put a state the visitor never claimed into the lead the studio reads.
 */
export const BUDGET_STATES = ['assigned', 'defining', 'exploring', 'declined'] as const;

export type BudgetState = (typeof BUDGET_STATES)[number];

/**
 * The tool carries the canonical state; the owner email is read by a person.
 * Resolving here keeps "Presupuesto: Sí, ya tengo presupuesto asignado" in the
 * mail instead of the bare id.
 */
export function budgetLabel(state: BudgetState, lang: Language): string {
  return translations[lang].ai.capture.budgetOptions[state];
}
