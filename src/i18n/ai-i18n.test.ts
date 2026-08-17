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

  it('labels every budget state in both languages', () => {
    // The <select> renders straight from BUDGET_STATES, so a state added there
    // without a label would ship a blank option rather than fail anywhere.
    for (const lang of ['es', 'en'] as const) {
      expect(translations[lang].ai.capture.budgetLabel).toBeTruthy();
      for (const state of BUDGET_STATES) {
        expect(translations[lang].ai.capture.budgetOptions[state]).toBeTruthy();
      }
    }
  });

  it('keeps the budget labels short enough for the contact endpoint', () => {
    // /api/contact rejects the whole payload with 400 when budget exceeds 100 chars
    // (src/pages/api/contact.ts). The label is what gets sent, so a long one would
    // fail the lead silently at submit time rather than here.
    for (const lang of ['es', 'en'] as const) {
      for (const state of BUDGET_STATES) {
        expect(translations[lang].ai.capture.budgetOptions[state].length).toBeLessThanOrEqual(100);
      }
    }
  });
});
