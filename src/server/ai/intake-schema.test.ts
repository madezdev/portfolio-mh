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
});

describe('leadSchema', () => {
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
