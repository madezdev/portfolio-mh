import { describe, it, expect } from 'vitest';
import { t, useTranslations } from './utils';

describe('t', () => {
  it('resolves a nested key in the requested language', () => {
    expect(t('services.pillars.ai.title', 'es')).toBe('IA aplicada');
    expect(t('services.pillars.ai.title', 'en')).toBe('Applied AI');
  });

  it('returns the key unchanged when it does not resolve', () => {
    expect(t('nope.not.here', 'es')).toBe('nope.not.here');
  });
});

describe('useTranslations', () => {
  it('binds t to the given language', () => {
    const { t: translate, lang } = useTranslations('en');
    expect(lang).toBe('en');
    expect(translate('services.pillars.ai.title')).toBe('Applied AI');
  });
});
