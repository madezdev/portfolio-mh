import { describe, it, expect } from 'vitest';
import { buildSitemap, SITEMAP_URL } from './sitemap';
import { CONTENT_LAST_MODIFIED, seoFor } from '../i18n/seo';

describe('buildSitemap', () => {
  const xml = buildSitemap();

  it('lists both indexable locales', () => {
    expect(xml).toContain('<loc>https://www.madez.dev/</loc>');
    expect(xml).toContain('<loc>https://www.madez.dev/en/</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it('reports lastmod, which the hand-written sitemap omitted', () => {
    // Google reads lastmod. It has ignored changefreq and priority for years.
    expect(xml.match(/<lastmod>/g)).toHaveLength(2);
    expect(xml).toContain(`<lastmod>${CONTENT_LAST_MODIFIED}</lastmod>`);
  });

  it('drops the fields Google ignores', () => {
    expect(xml).not.toContain('changefreq');
    expect(xml).not.toContain('priority');
  });

  it('declares the xhtml namespace it uses for alternates', () => {
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  it('annotates every url with the full hreflang cluster', () => {
    // Reciprocity matters here as much as in the head: if one url omits a
    // return link Google discards the pair.
    for (const hreflang of ['es', 'en', 'x-default']) {
      expect(xml.match(new RegExp(`hreflang="${hreflang}"`, 'g'))).toHaveLength(2);
    }
  });

  it('uses the same alternates as the head, from the same source', () => {
    for (const alt of seoFor('es').alternates) {
      expect(xml).toContain(`hreflang="${alt.hreflang}" href="${alt.href}"`);
    }
  });

  it('opens with a valid XML declaration and closes the urlset', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });

  it('stays at the url robots.txt already advertises', () => {
    // Changing this path silently orphans the Search Console submission.
    expect(SITEMAP_URL).toBe('https://www.madez.dev/sitemap.xml');
  });

  it('reports a lastmod a crawler can parse', () => {
    expect(CONTENT_LAST_MODIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(CONTENT_LAST_MODIFIED))).toBe(false);
  });
});
