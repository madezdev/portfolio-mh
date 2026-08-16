import { describe, it, expect } from 'vitest';
import { translations } from './translations';

describe('ai panel i18n', () => {
  it('defines the ai namespace in both languages', () => {
    for (const lang of ['es', 'en'] as const) {
      expect(translations[lang].ai.title).toBeTruthy();
      expect(translations[lang].ai.inputPlaceholder).toBeTruthy();
      expect(translations[lang].ai.disclosure).toBeTruthy();
      expect(translations[lang].ai.fallback.cta).toBeTruthy();
    }
  });
});
