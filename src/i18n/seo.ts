import type { Language } from './translations';

/** Canonical origin. The www variant is the one Google has indexed. */
export const SITE_ORIGIN = 'https://www.madez.dev';

/**
 * Path each locale is served from. Spanish is deliberately unprefixed: it is
 * the already-indexed canonical and moving it would force a migration.
 */
export const LOCALE_PATH: Record<Language, string> = {
  es: '/',
  en: '/en/',
};

export const DEFAULT_LANGUAGE: Language = 'es';

const OG_LOCALE: Record<Language, string> = {
  es: 'es_ES',
  en: 'en_US',
};

const PAGE_META: Record<Language, { title: string; description: string }> = {
  es: {
    title: 'madezdev — Estudio de producto digital | Del concepto a la realidad',
    description:
      'Estudio que diseña y construye productos web, SaaS y automatizaciones con IA. Del concepto a la realidad.',
  },
  en: {
    title: 'madezdev — Digital product studio | From concept to reality',
    description:
      'A studio that designs and builds web products, SaaS, and AI automations. From concept to reality.',
  },
};

export interface Alternate {
  readonly hreflang: string;
  readonly href: string;
}

export interface LocaleSeo {
  readonly lang: Language;
  readonly canonical: string;
  readonly alternates: readonly Alternate[];
  readonly ogLocale: string;
}

/** Absolute URL from a site-relative path. Built from constants, so no
 *  request query string can ever reach the canonical. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}

export function pageMeta(lang: Language): { title: string; description: string } {
  return PAGE_META[lang];
}

/**
 * The alternates array is identical for every locale on purpose. hreflang must
 * be reciprocal — if one page omits the return link, Google drops the pair.
 */
export function seoFor(lang: Language): LocaleSeo {
  return {
    lang,
    canonical: absoluteUrl(LOCALE_PATH[lang]),
    alternates: [
      { hreflang: 'es', href: absoluteUrl(LOCALE_PATH.es) },
      { hreflang: 'en', href: absoluteUrl(LOCALE_PATH.en) },
      { hreflang: 'x-default', href: absoluteUrl(LOCALE_PATH[DEFAULT_LANGUAGE]) },
    ],
    ogLocale: OG_LOCALE[lang],
  };
}
