import type { APIRoute } from 'astro';
import { buildSitemap } from '../lib/sitemap';

// Emitted at build time. The sitemap describes two prerendered pages, so
// serving it per request would be work with no request-dependent output.
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(buildSitemap(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
