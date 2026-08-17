import { describe, it, expect } from 'vitest';
import {
  seoFor,
  absoluteUrl,
  pageMeta,
  siteJsonLdFor,
  LOCALE_PATH,
  SITE_ORIGIN,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from './seo';
import type { Language } from './translations';
import { t } from './utils';

/** The graph is a flat list of typed nodes; tests address them by @type. */
function node(lang: Language, type: string) {
  const graph = siteJsonLdFor(lang)['@graph'] as Record<string, unknown>[];
  const found = graph.find((n) => n['@type'] === type);
  if (!found) throw new Error(`no ${type} node in the ${lang} graph`);
  return found;
}

describe('seoFor', () => {
  it('canonicalises each locale to its own path', () => {
    expect(seoFor('es').canonical).toBe('https://www.madez.dev/');
    expect(seoFor('en').canonical).toBe('https://www.madez.dev/en/');
  });

  it('emits an identical hreflang set on both locales', () => {
    // Non-reciprocal hreflang makes Google discard the whole cluster.
    expect(seoFor('en').alternates).toEqual(seoFor('es').alternates);
  });

  it('declares es, en and x-default', () => {
    expect(seoFor('es').alternates).toEqual([
      { hreflang: 'es', href: 'https://www.madez.dev/' },
      { hreflang: 'en', href: 'https://www.madez.dev/en/' },
      { hreflang: 'x-default', href: 'https://www.madez.dev/' },
    ]);
  });

  it('points x-default at the default locale', () => {
    const xDefault = seoFor('en').alternates.find((a) => a.hreflang === 'x-default');
    expect(xDefault?.href).toBe(absoluteUrl(LOCALE_PATH.es));
  });

  it('sets og:locale per language', () => {
    // Regression: es_ES pointed every social crawler at Spain. The studio and
    // its Spanish are Argentine.
    expect(seoFor('es').ogLocale).toBe('es_AR');
    expect(seoFor('en').ogLocale).toBe('en_US');
  });

  it('declares the other locale as the og:locale alternate', () => {
    expect(seoFor('es').ogLocaleAlternate).toBe('en_US');
    expect(seoFor('en').ogLocaleAlternate).toBe('es_AR');
  });

  it('gives each locale its own absolute share card', () => {
    expect(seoFor('es').ogImage).toBe('https://www.madez.dev/og-es.png');
    expect(seoFor('en').ogImage).toBe('https://www.madez.dev/og-en.png');
  });

  it('sizes the share card for a large social card', () => {
    // Regression: og:image was the 227x239 logo, far under the 1200x630 that
    // WhatsApp, LinkedIn, X and Slack need to render a large card at all.
    expect(OG_IMAGE_WIDTH).toBe(1200);
    expect(OG_IMAGE_HEIGHT).toBe(630);
  });

  it('keeps every alternate on the www origin', () => {
    for (const alt of seoFor('es').alternates) {
      expect(alt.href.startsWith(SITE_ORIGIN)).toBe(true);
    }
  });
});

describe('absoluteUrl', () => {
  it('never carries a query string into the canonical', () => {
    // Regression: Astro.url leaked ?utm_source into rel=canonical.
    expect(absoluteUrl('/')).toBe('https://www.madez.dev/');
    expect(absoluteUrl('/')).not.toContain('?');
  });
});

describe('pageMeta', () => {
  it('gives each locale a distinct title and description', () => {
    expect(pageMeta('es').title).not.toBe(pageMeta('en').title);
    expect(pageMeta('es').description).not.toBe(pageMeta('en').description);
  });

  it('describes the studio, not the old portfolio', () => {
    // Regression: Layout fell back to stale pre-redesign copy.
    expect(pageMeta('es').description).toContain('Estudio');
    expect(pageMeta('es').description).not.toContain('Node.js');
  });

  it('gives each locale a distinct og:image:alt', () => {
    expect(pageMeta('es').imageAlt).not.toBe(pageMeta('en').imageAlt);
  });

  it('does not describe the image with the pre-redesign personal byline', () => {
    // Regression: og:image:alt still read "Martin Hernandez - Desarrollador"
    // / "Martin Hernandez - Developer" after the site was rebranded to the
    // madezdev studio.
    expect(pageMeta('es').imageAlt).not.toContain('Martin Hernandez');
    expect(pageMeta('en').imageAlt).not.toContain('Martin Hernandez');
  });
});

describe('siteJsonLdFor — Organization node', () => {
  it('does not vary the entity url by locale', () => {
    // Regression guard: an Organization is one entity with one canonical
    // URL. This must fail if seoFor(lang).canonical is reintroduced here,
    // which would split the entity across / and /en/.
    expect(node('es', 'Organization').url).toBe(node('en', 'Organization').url);
  });

  it('shares the same @id across locales', () => {
    expect(node('es', 'Organization')['@id']).toBe(node('en', 'Organization')['@id']);
  });

  it('varies description per locale', () => {
    expect(node('es', 'Organization').description).not.toBe(node('en', 'Organization').description);
  });

  it('resolves the entity url to the default-locale root, not /en/', () => {
    expect(node('en', 'Organization').url).toBe('https://www.madez.dev/');
    expect(node('en', 'Organization').url).not.toBe('https://www.madez.dev/en/');
  });

  it('carries a logo, which a bare Organization was missing', () => {
    const logo = node('es', 'Organization').logo as Record<string, unknown>;
    expect(logo.url).toBe('https://www.madez.dev/logoMadezdev-2.png');
    expect(logo.width).toBe(227);
    expect(logo.height).toBe(239);
  });

  it('publishes no email address', () => {
    // Deliberate: the site has never published a mailbox, and the graph is the
    // easiest place on the page for a harvester to read one. Contact is the form.
    expect(JSON.stringify(siteJsonLdFor('es'))).not.toContain('@gmail.com');
    expect(node('es', 'Organization')).not.toHaveProperty('email');
  });

  it('points the contact channel at the locale it is rendered on', () => {
    const contact = (lang: Language) =>
      (node(lang, 'Organization').contactPoint as Record<string, unknown>).url;
    expect(contact('es')).toBe('https://www.madez.dev/#contact');
    expect(contact('en')).toBe('https://www.madez.dev/en/#contact');
  });
});

describe('siteJsonLdFor — graph shape', () => {
  it('declares the entity, the site, the offering and the page', () => {
    for (const lang of ['es', 'en'] as const) {
      const types = (siteJsonLdFor(lang)['@graph'] as Record<string, unknown>[]).map(
        (n) => n['@type'],
      );
      expect(types).toEqual(['Organization', 'WebSite', 'ProfessionalService', 'WebPage']);
    }
  });

  it('resolves every internal @id reference to a node it declares', () => {
    // A dangling {'@id': ...} is silently dropped by consumers, so the graph
    // would validate while saying nothing about who provides the services.
    for (const lang of ['es', 'en'] as const) {
      const declared = new Set<string>();
      const referenced: string[] = [];

      const walk = (value: unknown) => {
        if (Array.isArray(value)) return value.forEach(walk);
        if (value === null || typeof value !== 'object') return;
        const obj = value as Record<string, unknown>;
        const id = obj['@id'];
        if (typeof id === 'string') {
          // An object carrying nothing but @id is a pointer; anything else declares.
          if (Object.keys(obj).length === 1) referenced.push(id);
          else declared.add(id);
        }
        Object.values(obj).forEach(walk);
      };

      walk(siteJsonLdFor(lang)['@graph']);
      expect(referenced.length).toBeGreaterThan(0);
      for (const ref of referenced) expect([...declared]).toContain(ref);
    }
  });

  it('gives the page a locale-specific @id so the two pages are distinct', () => {
    expect(node('es', 'WebPage')['@id']).toBe('https://www.madez.dev/#webpage');
    expect(node('en', 'WebPage')['@id']).toBe('https://www.madez.dev/en/#webpage');
  });

  it('declares the share card as the page image at full size', () => {
    const image = node('en', 'WebPage').primaryImageOfPage as Record<string, unknown>;
    expect(image.url).toBe('https://www.madez.dev/og-en.png');
    expect(image.width).toBe(OG_IMAGE_WIDTH);
    expect(image.height).toBe(OG_IMAGE_HEIGHT);
  });

  it('uses BCP 47 tags for inLanguage, not og:locale underscores', () => {
    expect(node('es', 'WebSite').inLanguage).toBe('es-AR');
    expect(node('en', 'WebSite').inLanguage).toBe('en-US');
  });

  it('lists the four service pillars the page actually renders', () => {
    const catalog = node('es', 'ProfessionalService').hasOfferCatalog as Record<string, unknown>;
    const offers = catalog.itemListElement as Record<string, unknown>[];
    const names = offers.map((o) => (o.itemOffered as Record<string, unknown>).name);

    // Read from the same dictionary the services section renders, so the graph
    // cannot drift from the visible copy.
    expect(names).toEqual([
      t('services.pillars.web.title', 'es'),
      t('services.pillars.product.title', 'es'),
      t('services.pillars.automation.title', 'es'),
      t('services.pillars.ai.title', 'es'),
    ]);
  });

  it('translates the offer catalog', () => {
    const namesFor = (lang: Language) =>
      (
        (node(lang, 'ProfessionalService').hasOfferCatalog as Record<string, unknown>)
          .itemListElement as Record<string, unknown>[]
      ).map((o) => (o.itemOffered as Record<string, unknown>).name);

    expect(namesFor('en')).not.toEqual(namesFor('es'));
    expect(namesFor('en')[0]).toBe(t('services.pillars.web.title', 'en'));
  });

  it('never leaves an unresolved translation key in the graph', () => {
    // t() returns the key itself on a miss, which would publish
    // "services.pillars.web.title" as a service name.
    for (const lang of ['es', 'en'] as const) {
      expect(JSON.stringify(siteJsonLdFor(lang))).not.toContain('services.pillars');
    }
  });
});
