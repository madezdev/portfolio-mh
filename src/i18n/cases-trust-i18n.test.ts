import { describe, it, expect } from 'vitest';
import { translations } from './translations';

describe('cases + trust i18n', () => {
  it('defines cases and trust in both languages', () => {
    for (const lang of ['es', 'en'] as const) {
      expect(translations[lang].cases.title).toBeTruthy();
      expect(translations[lang].cases.liveLabel).toBeTruthy();
      expect(translations[lang].trust.title).toBeTruthy();
    }
  });
});
