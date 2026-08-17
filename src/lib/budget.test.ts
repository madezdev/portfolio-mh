import { describe, it, expect } from 'vitest';
import { BUDGET_STATES, budgetLabel } from './budget';

describe('budgetLabel', () => {
  it('resolves every state to a sentence in both languages', () => {
    for (const state of BUDGET_STATES) {
      expect(budgetLabel(state, 'es')).toMatch(/\s/); // a sentence, not a slug
      expect(budgetLabel(state, 'en')).toMatch(/\s/);
      expect(budgetLabel(state, 'es')).not.toBe(state);
    }
  });

  it('keeps the owner email readable rather than echoing the id', () => {
    expect(budgetLabel('assigned', 'es')).toMatch(/presupuesto asignado/i);
    expect(budgetLabel('exploring', 'en')).toMatch(/exploring/i);
  });
});
