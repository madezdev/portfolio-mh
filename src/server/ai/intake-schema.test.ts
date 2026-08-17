import { describe, it, expect } from 'vitest';
import { intakeStateSchema, leadSchema } from './intake-schema';

describe('intakeStateSchema', () => {
  it('accepts a partial update — the assistant learns one thing at a time', () => {
    expect(intakeStateSchema.safeParse({ isRewrite: false }).success).toBe(true);
    expect(intakeStateSchema.safeParse({}).success).toBe(true);
  });

  it('keeps isRewrite a boolean so a correction is an explicit act', () => {
    expect(intakeStateSchema.safeParse({ isRewrite: 'no' }).success).toBe(false);
  });

  it('rejects an empty string instead of storing it as a recorded answer', () => {
    // A live replay recorded `timeline: ""`. An omitted field means "not asked
    // yet"; an empty string is indistinguishable from an answer in the summary
    // and the lead. The schema now refuses to carry the ambiguity.
    for (const field of ['projectType', 'audience', 'stage', 'timeline'] as const) {
      expect(intakeStateSchema.safeParse({ [field]: '' }).success, field).toBe(false);
      expect(intakeStateSchema.safeParse({ [field]: 'x' }).success, field).toBe(true);
    }
  });

  it('cannot record declined — no single turn proves a refusal', () => {
    // Three prompt revisions asked the model not to assert this prematurely; a
    // replay then recorded `declined` on the turn BEFORE it asked the question.
    // `declined` is a claim about the whole conversation, so the incremental
    // recorder is not allowed to express it.
    expect(intakeStateSchema.safeParse({ budget: 'declined' }).success).toBe(false);
    for (const state of ['assigned', 'defining', 'exploring'] as const) {
      expect(intakeStateSchema.safeParse({ budget: state }).success, state).toBe(true);
    }
  });
});

describe('leadSchema', () => {
  it('still accepts declined — the close is the one place that can assert it', () => {
    expect(leadSchema.safeParse({
      name: 'Ada Lovelace', email: 'ada@studio.dev', budget: 'declined',
      summary: 'Sitio corporativo nuevo para una pyme, sin diseño previo.', language: 'es',
    }).success).toBe(true);
  });

  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@studio.dev',
    budget: 'assigned',
    summary: 'Sitio corporativo nuevo para una pyme, sin diseño previo.',
    language: 'es',
  };

  it('accepts a complete lead', () => {
    expect(leadSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a malformed email — this replaces the browser input validation', () => {
    expect(leadSchema.safeParse({ ...valid, email: 'ada@' }).success).toBe(false);
  });

  it('requires budget — this replaces the form field the design removes', () => {
    const { budget, ...withoutBudget } = valid;
    expect(leadSchema.safeParse(withoutBudget).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, budget: 'maybe' }).success).toBe(false);
  });

  it('rejects a summary too short to be a synthesis', () => {
    expect(leadSchema.safeParse({ ...valid, summary: 'ok' }).success).toBe(false);
  });

  it('describes language as the VISITOR\'s language, not the site\'s', () => {
    // Every other semantically loaded field is `.describe()`d; this one was not,
    // and a model can plausibly read a bare `'es' | 'en'` enum as the site's
    // language rather than the language to reply and confirm in.
    expect(leadSchema.shape.language.description).toMatch(/visitor/i);
  });
});
