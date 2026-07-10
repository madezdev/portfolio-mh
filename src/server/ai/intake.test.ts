import { describe, it, expect } from 'vitest';
import { intakeInstructions, INTAKE_MODEL, MAX_INPUT_MESSAGES } from './intake';

describe('intake config', () => {
  it('uses the gateway model string and a sane turn cap', () => {
    expect(INTAKE_MODEL).toBe('anthropic/claude-haiku-4.5');
    expect(MAX_INPUT_MESSAGES).toBeGreaterThan(0);
  });
  it('scopes the assistant: madezdev intake, no pricing, reply in user language', () => {
    const p = intakeInstructions().toLowerCase();
    expect(p).toContain('madezdev');
    expect(p).toContain('price'); // must instruct NOT to commit prices
    expect(p).toContain('language'); // must instruct to reply in the user's language
  });
});
