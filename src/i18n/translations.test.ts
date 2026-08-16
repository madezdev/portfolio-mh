import { describe, it, expect } from 'vitest';
import { translations } from './translations';
import { t } from './utils';

describe('studio shell translations', () => {
  it('exposes the studio tagline verbatim in both languages', () => {
    expect(t('hero.title.line1', 'es')).toBe('Del concepto');
    expect(t('hero.title.line2', 'es')).toBe('a la realidad');
    expect(t('brand.name', 'es')).toBe('madezdev');
    expect(t('brand.name', 'en')).toBe('madezdev');
  });

  it('has a symmetric hero.title shape across languages', () => {
    expect(Object.keys(translations.es.hero.title).sort())
      .toEqual(Object.keys(translations.en.hero.title).sort());
  });

  it('uses first-person-plural studio copy, not freelancer singular', () => {
    expect(t('hero.subtitle', 'es').toLowerCase()).toContain('construimos');
    expect(t('nav.contactCta', 'es')).toBe('Agendá una llamada');
  });
});
