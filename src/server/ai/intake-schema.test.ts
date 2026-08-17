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

  it('drops an empty string rather than recording it — and does not fail the turn', () => {
    // A live replay recorded `timeline: ""`. An omitted field means "not asked
    // yet"; an empty string is indistinguishable from an answer downstream.
    //
    // Dropped, not rejected. Rejecting surfaced an InvalidToolInputError through
    // the stream, which onError mapped to `ai_unavailable`, so production showed
    // the visitor "La IA no está disponible" while the conversation was working.
    // This is a scratchpad: "we do not know that" is a correct outcome, not an
    // error worth interrupting anyone over.
    for (const field of ['projectType', 'audience', 'stage', 'timeline'] as const) {
      const empty = intakeStateSchema.safeParse({ [field]: '   ' });
      expect(empty.success, field).toBe(true);
      // Zod leaves the key present holding `undefined`. What decides whether the
      // model sees it again is the JSON round-trip into the message history, and
      // that is where `undefined` disappears — so assert the trip, not the shape.
      expect(JSON.parse(JSON.stringify(empty.data)), field).not.toHaveProperty(field);

      const real = intakeStateSchema.safeParse({ [field]: 'x' });
      expect(real.success, field).toBe(true);
      expect(real.data, field).toHaveProperty(field, 'x');
    }
  });

  it('drops declined — no single turn proves a refusal', () => {
    // `declined` is a claim about the whole conversation (asked, asked again,
    // still refused), so the incremental recorder cannot express it. A replay
    // recorded it on the turn BEFORE the question was first asked.
    const declined = intakeStateSchema.safeParse({ budget: 'declined' });
    expect(declined.success).toBe(true);
    expect(JSON.parse(JSON.stringify(declined.data))).not.toHaveProperty('budget');

    // Same for a value that is not a state at all — production sent `budget: ""`.
    const blank = intakeStateSchema.safeParse({ budget: '' });
    expect(blank.success).toBe(true);
    expect(JSON.parse(JSON.stringify(blank.data))).not.toHaveProperty('budget');

    for (const state of ['assigned', 'defining', 'exploring'] as const) {
      expect(intakeStateSchema.safeParse({ budget: state }).data, state).toHaveProperty('budget', state);
    }
  });

  it('still refuses a value it cannot silently reinterpret', () => {
    // Dropping is for values that mean "unknown". A wrong TYPE is a different
    // thing — it means the model misunderstood the field, and quietly discarding
    // that would hide the misunderstanding.
    expect(intakeStateSchema.safeParse({ isRewrite: 'no' }).success).toBe(false);
    expect(intakeStateSchema.safeParse({ projectType: 42 }).success).toBe(false);
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
