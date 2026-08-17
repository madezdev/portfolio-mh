# Indexable locale routes for madez.dev

**Date:** 2026-08-16
**Status:** Approved, pending implementation plan

## Problem

The site is bilingual in the UI but monolingual to search engines. English content
exists and is human-written, but has no URL, so it cannot be indexed or ranked.

Verified against production HTML on 2026-08-16:

1. **One URL for two languages.** Language lives in a client-side nanostore
   (`src/i18n/store.ts:6`) hardcoded to `'es'`, flipped by a toggle that only writes
   `localStorage`. Google indexes documents at URLs; English has none.

2. **Invalid hreflang.** `src/layouts/Layout.astro:57-58` emits `hreflang="es"` and
   `hreflang="en"` both pointing at `https://www.madez.dev/`. Two language codes
   mapping to one URL is contradictory — Google discards the whole cluster. No
   `x-default`.

3. **Split-brain language negotiation.** `Layout.astro:15-21` and `index.astro:15-17`
   derive `lang` from the `Accept-Language` header, but the React islands read the
   nanostore, which never sees it. A request with `Accept-Language: en-US` returns
   `<html lang="en">` and an English `<title>` wrapped around a **Spanish `<h1>`**.
   The response carries no `Vary` header.

4. **Stale meta description.** `Layout.astro` `Props` is `{ title?, lang? }` — there is
   no `description` prop. `index.astro:22` computes the correct studio description but
   cannot pass it, so Layout falls back to its own pre-redesign `seoData`
   (`Layout.astro:27`). The stale text also feeds `og:description` and
   `twitter:description`.

5. **Canonical leaks query parameters.** `Layout.astro:43` uses `Astro.url`, which
   reflects the request URL. `GET /?utm_source=linkedin` self-canonicals to
   `https://www.madez.dev/?utm_source=linkedin`, splitting ranking signals across every
   campaign-tagged link.

6. **No CDN caching.** Response headers are `cache-control: public, max-age=0,
   must-revalidate` with `x-vercel-cache: MISS`. Every request executes the SSR
   function for a page with no request-dependent output.

7. **No `robots.txt`, no `sitemap.xml`.** Both return 404 in production.

## Goals

- English becomes independently indexable at its own URL.
- Reciprocal, valid hreflang with `x-default`.
- Close audit findings 1, 3, 5, 6, 7 and the crawl-file gap as a side effect of the
  routing work.
- No migration risk to the currently indexed root URL.

## Non-goals

Deliberately excluded; independent of this refactor and deferred:

- 1200x630 Open Graph card (currently an 86KB logo PNG under
  `twitter:card=summary_large_image`).
- Enriched JSON-LD (`logo`, `image`, `contactPoint`, a sibling `WebSite` node).
- Self-hosted fonts to unblock LCP.
- Any new content, case study pages, or blog.

## Decisions

### URL shape: Spanish at root, English prefixed

```
https://www.madez.dev/       -> Spanish  (existing canonical, unmoved)
https://www.madez.dev/en/    -> English  (new)
```

Rejected: symmetric `/es/` + `/en/` with `/` redirecting to `/es/`. It is the
textbook shape, but it moves the URL Google has already indexed, forcing a migration
and a temporary ranking dip while the redirect is reprocessed. Serving the default
locale at the root with alternates prefixed is a pattern Google supports explicitly,
and it introduces no redirects and no migration risk.

### Language propagation: props, not shared module state

A nanostore atom is module-level state. Under SSR that module is shared across
concurrent requests, so setting it per-request lets two simultaneous visitors on `/`
and `/en/` overwrite each other's language. This is a real race, not a theoretical
one — and it is why `store.ts:4-5` currently pins the store to `'es'` and notes that
"server and client both render 'es' so there is never a hydration mismatch".

Language therefore flows as a prop from the page into each island. Astro serializes
island props into the rendered output, so server and client agree by construction:
no shared mutable state, no hydration mismatch.

`src/i18n/utils.ts` needs almost no change — `useTranslations(lang?: Language)`
already accepts an explicit language and only falls back to the store when the
argument is omitted. The contract already exists.

### `lang` becomes a required argument

`t()` and `useTranslations()` change `lang` from optional to required.

This is deliberate. Left optional, any call site that forgets the argument silently
falls back to the store and reintroduces mixed-language rendering with no error. Made
required, the same mistake is a compile error. A silent content bug becomes a build
failure.

Once every call site passes `lang` explicitly, `src/i18n/store.ts` has no remaining
consumer and is deleted.

### Language toggle becomes navigation

With language in the URL, switching language is a navigation, not a state change. The
toggle becomes two anchors instead of two buttons.

This is a forced consequence, not a preference. It costs the instant client-side
switch and buys crawlable links between locales — which is the mechanism by which
Google discovers and indexes the English version at all. The two cannot coexist.

The segmented visual (sliding ember pill) is preserved. `aria-pressed` becomes
`aria-current="page"`, the correct attribute when the active option is a location
rather than a state.

### Both routes prerender

`export const prerender = true` on both pages. Once `Accept-Language` negotiation is
removed, neither page has request-dependent output, so both ship as static HTML served
from the CDN. This closes finding 6 outright.

`/api/contact` and `/api/chat` remain server-rendered; Astro allows per-route
prerendering under `output: 'server'`.

Accepted cost: changing page copy now requires a redeploy.

## Architecture

### Files

| Path | Change |
| --- | --- |
| `src/pages/index.astro` | Spanish page. Add `prerender`, drop `Accept-Language`, render shared partial with `lang="es"` |
| `src/pages/en/index.astro` | **New.** English page, same shape with `lang="en"` |
| `src/components/StudioPage.astro` | **New.** Shared island composition, takes `lang`, passes it to every island |
| `src/layouts/Layout.astro` | Add `description` prop; require `lang`; fix canonical; correct hreflang; delete `seoData`, `meta keywords`, unused store import, inline lang script |
| 9 island components in `src/components/*.tsx` | Accept `lang` prop; remove `useStore(currentLanguage)` |
| `src/components/LanguageToggle.tsx` | The 10th store consumer. Also becomes anchors to `/` and `/en/` |
| `src/i18n/utils.ts` | `lang` required on `t()` and `useTranslations()` |
| `src/i18n/store.ts` | **Deleted** — no remaining consumer |
| `public/robots.txt` | **New** |
| `public/sitemap.xml` | **New** |

A dynamic `[lang]` route was rejected: with Spanish unprefixed, the `getStaticPaths`
mapping is less legible than two explicit files.

### Head output

Spanish page (`/`):

```html
<html lang="es">
<title>madezdev — Estudio de producto digital | Del concepto a la realidad</title>
<meta name="description" content="Estudio que diseña y construye productos web, SaaS y automatizaciones con IA. Del concepto a la realidad.">
<link rel="canonical" href="https://www.madez.dev/">
<link rel="alternate" hreflang="es" href="https://www.madez.dev/">
<link rel="alternate" hreflang="en" href="https://www.madez.dev/en/">
<link rel="alternate" hreflang="x-default" href="https://www.madez.dev/">
<meta property="og:locale" content="es_ES">
```

English page (`/en/`): identical `hreflang` block — byte-for-byte, including
`x-default` pointing at `/` — with `lang="en"`, the English title and description, and
`og:locale` of `en_US`. The canonical is `https://www.madez.dev/en/`.

Reciprocity is the requirement that most often breaks in practice. If `/en/` does not
point back to `/`, Google drops the pair and the outcome is identical to today's
broken state.

### Crawl files

`robots.txt` allows everything and declares the sitemap. `sitemap.xml` lists both URLs
with **no `xhtml:link` alternates**.

That omission is intentional. Hreflang may be declared in HTML, HTTP headers, or the
sitemap, but when two sources disagree Google discards the conflicting pair. With two
URLs the HTML annotations are sufficient, and a single source of truth cannot drift
out of sync with itself.

## Testing

TDD: tests are written before the change they describe. Runner is `npm test`
(`vitest run`).

**Existing suite.** The 9 island component tests pass `lang` explicitly instead of
relying on the store default. `LanguageToggle.test.tsx` is rewritten: it asserts two
anchors with correct `href` and `hreflang` and a correct `aria-current`, rather than
asserting a `setLanguage` call.

**New coverage** — the part that carries the value and is untested today:

- Both pages emit the same three-entry hreflang set, and every entry is reciprocal.
- `x-default` is present and resolves to `/`.
- Canonical is derived from the pathname, so a query string does not appear in it.
- `<html lang>` matches the language of the rendered body content — the regression that
  produced the split-brain page.
- Each locale renders its own translations end to end, with no leakage from the other.

## Risks

| Risk | Mitigation |
| --- | --- |
| A component is missed and silently renders Spanish inside `/en/` | Required `lang` argument turns the omission into a compile error |
| Non-reciprocal hreflang leaves the cluster invalid | Explicitly asserted in tests, on both pages |
| Prerender makes copy changes need a redeploy | Accepted and understood; page copy changes rarely |
| Thin or duplicated locale content is a site-wide quality signal | Not applicable: translations are existing human-written content, not machine output |

## Verification after deploy

1. `curl -sI https://www.madez.dev/` shows a cache `HIT` rather than `MISS`.
2. `/robots.txt` and `/sitemap.xml` return 200.
3. `GET /?utm_source=test` canonicals to `https://www.madez.dev/` with no query string.
4. `/en/` returns `<html lang="en">` with an English `<h1>`.
5. Submit the sitemap in Search Console and confirm `/en/` is indexed.
