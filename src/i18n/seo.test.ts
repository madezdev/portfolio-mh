import { describe, it, expect } from 'vitest';
import { seoFor, absoluteUrl, pageMeta, LOCALE_PATH, SITE_ORIGIN } from './seo';

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
});
