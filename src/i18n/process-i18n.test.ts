import { describe, it, expect } from 'vitest';
import { translations } from './translations';

describe('process i18n', () => {
  it('defines the four journey steps in both languages', () => {
    const steps = ['idea', 'design', 'build', 'ship'];
    for (const lang of ['es', 'en'] as const) {
      expect(translations[lang].process.title).toBeTruthy();
      expect(Object.keys(translations[lang].process.steps).sort()).toEqual([...steps].sort());
    }
  });
});
