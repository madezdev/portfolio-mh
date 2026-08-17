import {
  CONTENT_LAST_MODIFIED,
  LOCALE_PATH,
  absoluteUrl,
  seoFor,
} from '../i18n/seo';
import type { Language } from '../i18n/translations';

const LOCALES = Object.keys(LOCALE_PATH) as Language[];

/** `&` is the only character that can appear in these URLs and break the XML,
 *  but escaping the full set costs nothing and survives future query params. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * The sitemap is generated rather than hand-maintained so it cannot contradict
 * the `<head>`: both the alternates and the canonical come from `seoFor`.
 *
 * `changefreq` and `priority` are deliberately absent — Google has ignored both
 * for years. `lastmod`, which it does read, was the field the static file was
 * missing, along with the hreflang annotations that tell Google the two URLs
 * are one page in two languages.
 */
export function buildSitemap(): string {
  const urls = LOCALES.map((lang) => {
    const { canonical, alternates } = seoFor(lang);
    const links = alternates
      .map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}"/>`,
      )
      .join('\n');

    return [
      '  <url>',
      `    <loc>${escapeXml(canonical)}</loc>`,
      `    <lastmod>${CONTENT_LAST_MODIFIED}</lastmod>`,
      links,
      '  </url>',
    ].join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

/** Absolute URL of the sitemap itself, for `robots.txt` and Search Console. */
export const SITEMAP_URL = absoluteUrl('/sitemap.xml');
