import { translations, type Language } from './translations';

/**
 * `lang` is required on purpose. When it was optional, any call site that
 * forgot it silently fell back to a global store and rendered the wrong
 * language with no error. Required turns that mistake into a compile error.
 */
export function t(key: string, lang: Language): string {
  const keys = key.split('.');
  let value: unknown = translations[lang];

  for (const k of keys) {
    value = (value as Record<string, unknown> | undefined)?.[k];
  }

  return typeof value === 'string' ? value : key;
}

export function useTranslations(lang: Language) {
  return {
    t: (key: string) => t(key, lang),
    lang,
  };
}
