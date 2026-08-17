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
    .describe('true = rebuilding a site that already exists. false = building from scratch. Correct this the moment the visitor contradicts it.'),
  audience: z.string().max(120).optional(),
  stage: z.string().max(120).optional(),
  timeline: z.string().max(80).optional(),
  budget: budget.optional(),
});

/** The close. Required fields are the contract that replaces the removed form. */
export const leadSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(200),
  budget,
  summary: z.string().min(20).max(1200)
    .describe('One short paragraph: what they need, for whom, at what stage.'),
  language: z.enum(['es', 'en']),
});

export type IntakeState = z.infer<typeof intakeStateSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
