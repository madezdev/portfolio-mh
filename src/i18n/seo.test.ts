import { describe, it, expect } from 'vitest';
import { seoFor, absoluteUrl, pageMeta, orgJsonLdFor, LOCALE_PATH, SITE_ORIGIN } from './seo';

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
    expect(seoFor('es').ogLocale).toBe('es_ES');
    expect(seoFor('en').ogLocale).toBe('en_US');
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

describe('orgJsonLdFor', () => {
  it('does not vary the entity url by locale', () => {
    // Regression guard: an Organization is one entity with one canonical
    // URL. This must fail if seoFor(lang).canonical is reintroduced here,
    // which would split the entity across / and /en/.
    expect(orgJsonLdFor('es').url).toBe(orgJsonLdFor('en').url);
  });

  it('shares the same @id across locales', () => {
    expect(orgJsonLdFor('es')['@id']).toBe(orgJsonLdFor('en')['@id']);
  });

  it('varies description per locale', () => {
    expect(orgJsonLdFor('es').description).not.toBe(orgJsonLdFor('en').description);
  });

  it('resolves the entity url to the default-locale root, not /en/', () => {
    expect(orgJsonLdFor('en').url).toBe('https://www.madez.dev/');
    expect(orgJsonLdFor('en').url).not.toBe('https://www.madez.dev/en/');
  });
});
