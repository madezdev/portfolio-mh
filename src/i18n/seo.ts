import type { Language } from './translations';
import { t } from './utils';

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

/**
 * The studio is Argentine and its Spanish is Rioplatense, so `es_ES` was
 * telling every social crawler the wrong region.
 */
const OG_LOCALE: Record<Language, string> = {
  es: 'es_AR',
  en: 'en_US',
};

/** BCP 47 tags for schema.org `inLanguage`, which wants dashes, not underscores. */
const CONTENT_LANGUAGE: Record<Language, string> = {
  es: 'es-AR',
  en: 'en-US',
};

/**
 * Share cards, one per locale. The logo used to stand in here at 227x239 —
 * below the 1200x630 that WhatsApp, LinkedIn, X and Slack require for a large
 * card, so every shared link rendered as a thumbnail or as nothing at all.
 */
const OG_IMAGE_PATH: Record<Language, string> = {
  es: '/og-es.png',
  en: '/og-en.png',
};

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_TYPE = 'image/png';

/**
 * Date reported as `lastmod` in the sitemap. Bump it when page content
 * changes in a way worth recrawling — not on every build. Google ignores
 * `lastmod` from sites where it always equals the deploy time.
 */
export const CONTENT_LAST_MODIFIED = '2026-08-17';

const PAGE_META: Record<Language, { title: string; description: string; imageAlt: string }> = {
  es: {
    title: 'madezdev — Estudio de producto digital | Del concepto a la realidad',
    description:
      'Estudio que diseña y construye productos web, SaaS y automatizaciones con IA. Del concepto a la realidad.',
    imageAlt: 'madezdev — Estudio de producto digital',
  },
  en: {
    title: 'madezdev — Digital product studio | From concept to reality',
    description:
      'A studio that designs and builds web products, SaaS, and AI automations. From concept to reality.',
    imageAlt: 'madezdev — Digital product studio',
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
  readonly ogLocaleAlternate: string;
  readonly ogImage: string;
}

/** Absolute URL from a site-relative path. Built from constants, so no
 *  request query string can ever reach the canonical. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}

export function pageMeta(lang: Language): { title: string; description: string; imageAlt: string } {
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
    ogLocaleAlternate: OG_LOCALE[lang === 'es' ? 'en' : 'es'],
    ogImage: absoluteUrl(OG_IMAGE_PATH[lang]),
  };
}

/** Stable node identifiers. Every cross-reference in the graph is an `@id`
 *  pointer rather than a repeated literal, so one node describes one thing. */
const ORG_ID = `${SITE_ORIGIN}/#organization`;
const LOGO_ID = `${SITE_ORIGIN}/#logo`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const SERVICE_ID = `${SITE_ORIGIN}/#service`;

/**
 * Copy that exists only inside the graph. It stays here rather than in
 * `translations.ts` because nothing renders it — putting it in the UI
 * dictionary would imply a component is meant to show it.
 */
const GRAPH_COPY: Record<Language, { serviceType: string; catalog: string; contactType: string }> = {
  es: {
    serviceType: 'Diseño y desarrollo de productos digitales',
    catalog: 'Servicios de madezdev',
    contactType: 'Consultas comerciales',
  },
  en: {
    serviceType: 'Digital product design and development',
    catalog: 'madezdev services',
    contactType: 'Sales',
  },
};

/** The four pillars the services section renders, as schema.org Offers. Read
 *  from the same dictionary the page reads, so the structured data cannot
 *  drift from the visible copy — which is exactly what Google checks for. */
const SERVICE_PILLARS = ['web', 'product', 'automation', 'ai'] as const;

/**
 * An Organization is one real-world entity with one canonical URL, tied
 * together by a stable @id. `/en/` is a page of that organization's site,
 * not the organization's own URL — so `url` and `@id` are locale-invariant
 * even though `description` still varies per locale.
 */
function organizationNode(lang: Language) {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'madezdev',
    alternateName: 'madez.dev',
    url: absoluteUrl(LOCALE_PATH[DEFAULT_LANGUAGE]),
    description: pageMeta(lang).description,
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: absoluteUrl('/logoMadezdev-2.png'),
      width: 227,
      height: 239,
      caption: 'madezdev',
    },
    image: { '@id': LOGO_ID },
    founder: {
      '@type': 'Person',
      name: 'Martin Hernandez',
      url: 'https://github.com/madezdev',
    },
    areaServed: [{ '@type': 'Country', name: 'Argentina' }],
    knowsLanguage: ['es', 'en'],
    sameAs: [
      'https://github.com/madezdev',
      'https://www.linkedin.com/company/madezdev',
      'https://x.com/madezdev',
    ],
    // No `email` on purpose: the site has never published an address, and a
    // plain-text mailbox in the graph is the cheapest thing on the page for a
    // harvester to take. The contact form is the published channel.
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: GRAPH_COPY[lang].contactType,
      availableLanguage: ['es', 'en'],
      url: `${absoluteUrl(LOCALE_PATH[lang])}#contact`,
    },
  };
}

function webSiteNode(lang: Language) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: absoluteUrl(LOCALE_PATH[DEFAULT_LANGUAGE]),
    name: 'madezdev',
    description: pageMeta(lang).description,
    publisher: { '@id': ORG_ID },
    inLanguage: CONTENT_LANGUAGE[lang],
  };
}

function serviceNode(lang: Language) {
  return {
    '@type': 'ProfessionalService',
    '@id': SERVICE_ID,
    name: 'madezdev',
    url: absoluteUrl(LOCALE_PATH[lang]),
    description: pageMeta(lang).description,
    serviceType: GRAPH_COPY[lang].serviceType,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Argentina' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: GRAPH_COPY[lang].catalog,
      itemListElement: SERVICE_PILLARS.map((pillar) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: t(`services.pillars.${pillar}.title`, lang),
          description: t(`services.pillars.${pillar}.description`, lang),
          provider: { '@id': ORG_ID },
        },
      })),
    },
  };
}

function webPageNode(lang: Language) {
  const pageUrl = absoluteUrl(LOCALE_PATH[lang]);
  return {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: pageMeta(lang).title,
    description: pageMeta(lang).description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: CONTENT_LANGUAGE[lang],
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: absoluteUrl(OG_IMAGE_PATH[lang]),
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
    },
  };
}

/**
 * One `@graph` per page instead of a lone Organization. A bare Organization
 * says who we are and nothing about what the page offers, so Google had no
 * way to connect the entity to the four services the page actually sells.
 */
export function siteJsonLdFor(lang: Language) {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationNode(lang), webSiteNode(lang), serviceNode(lang), webPageNode(lang)],
  };
}
