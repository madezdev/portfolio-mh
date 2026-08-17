import { z } from 'zod';
import { BUDGET_STATES } from '../../lib/budget';

const budget = z.enum(BUDGET_STATES);

/**
 * What the assistant has understood so far. Everything is optional because it
 * accumulates one turn at a time — and because a turn may CORRECT an earlier
 * value rather than add a new one.
 */
export const intakeStateSchema = z.object({
  projectType: z.string().max(120).optional()
    .describe('What they want built, in their words: "sitio corporativo", "SaaS de turnos"'),
  isRewrite: z.boolean().optional()
    .describe('true = rebuilding a site that already exists. false = building from scratch. Omit until the visitor states which, in their own words — tapping the "Rehacer mi web" chip is not a statement. "Quiero hacer una web" means from scratch (false).'),
  audience: z.string().max(120).optional()
    .describe('Who the project is for, if they said: their own customers, internal staff, themself. Omit if they have not told you.'),
  stage: z.string().max(120).optional()
    .describe('How far along the project is, if they said: idea, has designs, has a site already, mid-build. Omit if they have not told you.'),
  timeline: z.string().max(80).optional()
    .describe('When they want this live, in their words: "ASAP", "next quarter", "no rush". Omit if they have not told you.'),
  budget: budget.optional()
    .describe('The budget situation as the visitor described it. Omit until you have asked and they have answered. Correct it if they revise it later.'),
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
