import { describe, it, expect } from 'vitest';
import { translations } from './translations';
import { BUDGET_STATES } from '../lib/budget';

describe('ai panel i18n', () => {
  it('defines the ai namespace in both languages', () => {
    for (const lang of ['es', 'en'] as const) {
      expect(translations[lang].ai.title).toBeTruthy();
      expect(translations[lang].ai.inputPlaceholder).toBeTruthy();
      expect(translations[lang].ai.disclosure).toBeTruthy();
      expect(translations[lang].ai.fallback.cta).toBeTruthy();
    }
  });

  it('keeps the budget labels that the owner email renders', () => {
    // These stopped being form copy in this change; they are now the label source
    // for the "Presupuesto:" line, so deleting them would ship a slug in the mail.
    for (const lang of ['es', 'en'] as const) {
      for (const state of BUDGET_STATES) {
        expect(translations[lang].ai.capture.budgetOptions[state]).toBeTruthy();
        expect(translations[lang].ai.capture.budgetOptions[state].length).toBeLessThanOrEqual(100);
      }
    }
  });
});
