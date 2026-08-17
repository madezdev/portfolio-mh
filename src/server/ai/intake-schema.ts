import { z } from 'zod';
import { BUDGET_STATES, OBSERVABLE_BUDGET_STATES } from '../../lib/budget';

/** Every state, including `declined`. Only the close may assert that one. */
const budget = z.enum(BUDGET_STATES);
/** What a turn can observe. Excludes `declined` by construction. */
const observableBudget = z.enum(OBSERVABLE_BUDGET_STATES);

/**
 * What the assistant has understood so far. Everything is optional because it
 * accumulates one turn at a time — and because a turn may CORRECT an earlier
 * value rather than add a new one.
 */
export const intakeStateSchema = z.object({
  projectType: z.string().min(1).max(120).optional()
    .describe('What they want built, in their words: "sitio corporativo", "SaaS de turnos"'),
  isRewrite: z.boolean().optional()
    .describe('true = rebuilding a site that already exists. false = building from scratch. Omit until the visitor states which, in their own words — tapping the "Rehacer mi web" chip is not a statement. "Quiero hacer una web" means from scratch (false).'),
  audience: z.string().min(1).max(120).optional()
    .describe('Who the project is for, if they said: their own customers, internal staff, themself. Omit if they have not told you.'),
  stage: z.string().min(1).max(120).optional()
    .describe('How far along the project is, if they said: idea, has designs, has a site already, mid-build. Omit if they have not told you.'),
  timeline: z.string().min(1).max(80).optional()
    .describe('When they want this live, in their words: "ASAP", "next quarter", "no rush". Omit if they have not told you.'),
  // Deliberately narrower than `leadSchema.budget`: no `declined`. See
  // OBSERVABLE_BUDGET_STATES — a refusal is a fact about the whole conversation,
  // not something a turn can observe, and a replay caught this field being set to
  // `declined` on the turn before the question was first asked.
  budget: observableBudget.optional()
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
