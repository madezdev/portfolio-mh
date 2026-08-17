import { z } from 'zod';
import { BUDGET_STATES, OBSERVABLE_BUDGET_STATES } from '../../lib/budget';

/** Every state, including `declined`. Only the close may assert that one. */
const budget = z.enum(BUDGET_STATES);

/**
 * Scratchpad fields DROP what they cannot accept instead of rejecting it.
 *
 * Rejecting looked right and shipped a worse bug. An invalid tool input raises
 * `InvalidToolInputError` through the stream, `onError` maps it to
 * `ai_unavailable`, and production showed the visitor "La IA no está disponible"
 * while the conversation underneath was working fine — a guard doing its job,
 * presented as an outage. Observed live with `{ timeline: '', budget: '' }`.
 *
 * Dropping is also the honest semantics for THIS schema. It is a record of what
 * is known; "we do not know that" is a correct outcome, not an error. The strict
 * treatment stays where it belongs, on `leadSchema`, which is what the studio
 * actually receives.
 */
const known = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().min(1).max(max).optional(),
  );

/**
 * A turn can only observe the three answerable states. Anything else — most often
 * `declined`, which is a claim about the whole conversation rather than something
 * a visitor says — is dropped rather than refused, for the reason above.
 */
const observedBudget = z.preprocess(
  (v) => ((OBSERVABLE_BUDGET_STATES as readonly string[]).includes(v as string) ? v : undefined),
  z.enum(OBSERVABLE_BUDGET_STATES).optional(),
);

/**
 * What the assistant has understood so far. Everything is optional because it
 * accumulates one turn at a time — and because a turn may CORRECT an earlier
 * value rather than add a new one.
 */
export const intakeStateSchema = z.object({
  projectType: known(120)
    .describe('What they want built, in their words: "sitio corporativo", "SaaS de turnos"'),
  // Not dropped: a wrong TYPE here means the model misunderstood the field, and
  // silently discarding that would hide the misunderstanding. Only values that
  // mean "unknown" get dropped.
  isRewrite: z.boolean().optional()
    .describe('true = rebuilding a site that already exists. false = building from scratch. Omit until the visitor states which, in their own words — tapping the "Rehacer mi web" chip is not a statement. "Quiero hacer una web" means from scratch (false).'),
  audience: known(120)
    .describe('Who the project is for, if they said: their own customers, internal staff, themself. Omit if they have not told you.'),
  stage: known(120)
    .describe('How far along the project is, if they said: idea, has designs, has a site already, mid-build. Omit if they have not told you.'),
  timeline: known(80)
    .describe('When they want this live, in their words: "ASAP", "next quarter", "no rush". Omit if they have not told you.'),
  // Deliberately narrower than `leadSchema.budget`: no `declined`. See
  // OBSERVABLE_BUDGET_STATES — a refusal is a fact about the whole conversation,
  // not something a turn can observe, and a replay caught this field being set to
  // `declined` on the turn before the question was first asked.
  budget: observedBudget
    .describe('The budget situation as the visitor answered it. Omit until you have asked AND they have answered.'),
});

/** The close. Required fields are the contract that replaces the removed form. */
export const leadSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.email().max(200),
  budget,
  summary: z.string().min(20).max(1200)
    .describe('One short paragraph: what they need, for whom, at what stage.'),
  language: z.enum(['es', 'en'])
    .describe('The language the VISITOR has been writing in. Selects the confirmation email they receive.'),
});

export type IntakeState = z.infer<typeof intakeStateSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
