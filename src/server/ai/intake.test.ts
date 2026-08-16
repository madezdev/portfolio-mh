import { describe, it, expect } from 'vitest';
import { intakeInstructions, INTAKE_MODEL, MAX_INPUT_MESSAGES } from './intake';

describe('intake config', () => {
  it('uses a gateway model string and a sane turn cap', () => {
    // `provider/model` is the Gateway's routing format — a bare model id resolves to
    // no provider. The provider itself is free to change (it did, when the account's
    // free tier turned out not to reach Claude Haiku), so pin the shape, not the name.
    expect(INTAKE_MODEL).toMatch(/^[a-z0-9-]+\/[a-z0-9.\-]+$/);
    expect(MAX_INPUT_MESSAGES).toBeGreaterThan(0);
  });
  it('scopes the assistant: madezdev intake, no pricing, reply in user language', () => {
    const p = intakeInstructions().toLowerCase();
    expect(p).toContain('madezdev');
    expect(p).toContain('price'); // must instruct NOT to commit prices
    expect(p).toContain('language'); // must instruct to reply in the user's language
  });
});
