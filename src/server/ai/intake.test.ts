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

  it('asks whether the visitor has a budget assigned before inviting contact', () => {
    // The prompt used to carry a single rule — "do NOT quote, estimate, or commit to
    // any price, cost, or budget number" — which conflated two opposite things:
    // GIVING a price (forbidden) and ASKING about theirs (required intake data).
    // The model read `budget` inside a prohibition and dropped the subject entirely.
    const p = intakeInstructions().toLowerCase();
    expect(p).toContain('budget');
    // The three states it must offer. No amounts: this studio qualifies on whether
    // the money exists, not on how much, which is also why the no-quoting rule below
    // can survive untouched.
    expect(p).toContain('assigned');
    expect(p).toContain('still being defined');
    expect(p).toContain('exploring');
    // Asked before the close, not after — a lead that leaves at the capture form
    // should already have been asked.
    expect(p).toMatch(/before .*(invit|contact)/);
  });

  it('still forbids the assistant from quoting a price of its own', () => {
    // Guards the other side of the split: someone re-tightening the pricing rule
    // must not switch the budget question back off.
    const p = intakeInstructions().toLowerCase();
    expect(p).toMatch(/never (quote|give)/);
  });

  it('does not let a dodged budget question block the conversation', () => {
    const p = intakeInstructions().toLowerCase();
    expect(p).toMatch(/once more|one more time/);
    expect(p).toMatch(/move on/);
  });
});
