import { describe, it, expect } from 'vitest';
import { translations } from './translations';
import { t } from './utils';

describe('services pillars i18n', () => {
  it('has exactly the four outcome pillars in both languages', () => {
    const pillars = ['web', 'product', 'automation', 'ai'];
    expect(Object.keys(translations.es.services.pillars).sort()).toEqual([...pillars].sort());
    expect(Object.keys(translations.en.services.pillars).sort()).toEqual([...pillars].sort());
  });
  it('is outcome-framed, studio voice', () => {
    expect(t('services.pillars.ai.title', 'es')).toBe('IA aplicada');
    expect(t('services.pillars.product.title', 'en')).toBe('Products & custom SaaS');
  });
});
