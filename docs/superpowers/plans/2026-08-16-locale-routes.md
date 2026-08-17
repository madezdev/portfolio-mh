# Indexable Locale Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the English content its own indexable URL at `/en/`, with valid reciprocal hreflang, while leaving the already-indexed Spanish root untouched.

**Architecture:** Language stops living in a client-side nanostore and becomes a required prop flowing from each Astro page into its React islands. All head/SEO values move into a pure TypeScript module so they can be unit-tested. Both pages prerender to static HTML.

**Tech Stack:** Astro 5 (`output: 'server'` with per-route `prerender`), React 19 islands, TypeScript strict, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-08-16-locale-routes-design.md`

## Global Constraints

- Spanish is served at `/` and must **not** move — it is the already-indexed canonical. English is new at `/en/`.
- The hreflang set is **identical on both pages**: `es` → `https://www.madez.dev/`, `en` → `https://www.madez.dev/en/`, `x-default` → `https://www.madez.dev/`. Non-reciprocal hreflang causes Google to discard the entire cluster.
- Canonical URLs are built from a path constant, never from `Astro.url`. `Astro.url` reflects the request and leaks query strings into the canonical.
- `lang` is a **required** argument on `t()` and `useTranslations()`, and a **required** prop on every island. Optional would let a missed call site fall back silently and reproduce the mixed-language bug.
- Site origin is exactly `https://www.madez.dev` (with `www`).
- Test runner is `npm test` (`vitest run`). Vitest only collects `src/**/*.test.{ts,tsx}` — `.astro` files cannot be unit-tested, which is why head logic lives in `src/i18n/seo.ts`.
- Never add `Co-Authored-By` or AI attribution to commits. Conventional commits only.
- Do not run `npm run build` as part of these tasks.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `src/i18n/seo.ts` | **New.** Single source of truth for locale paths, canonical URLs, the hreflang set, og:locale, and per-locale title/description. Pure, no Astro imports. |
| `src/i18n/seo.test.ts` | **New.** Proves reciprocity, x-default, and query-free canonicals. |
| `src/i18n/utils.ts` | `t()` / `useTranslations()` with `lang` required. |
| `src/i18n/store.ts` | **Deleted** in Task 4. |
| `src/components/*.tsx` (9 islands) | Accept `lang` prop instead of reading the store. |
| `src/components/LanguageToggle.tsx` | Two anchors linking the locales. |
| `src/layouts/Layout.astro` | Renders head from `seo.ts`. Required `lang`, `title`, `description`. |
| `src/components/StudioPage.astro` | **New.** Island composition shared by both routes; takes `lang`. |
| `src/pages/index.astro` | Spanish route, prerendered. |
| `src/pages/en/index.astro` | **New.** English route, prerendered. |
| `public/robots.txt` | **New.** |
| `public/sitemap.xml` | **New.** |

---

### Task 1: Locale SEO module

Pure module with no dependencies on Astro or React, so the hreflang contract is unit-testable. Building canonicals from a path constant is what structurally prevents query-string leakage — there is no request URL involved to leak from.

**Files:**
- Create: `src/i18n/seo.ts`
- Test: `src/i18n/seo.test.ts`

**Interfaces:**
- Consumes: `Language` from `src/i18n/translations.ts`
- Produces: `SITE_ORIGIN: string`, `LOCALE_PATH: Record<Language, string>`, `DEFAULT_LANGUAGE: Language`, `absoluteUrl(path: string): string`, `pageMeta(lang: Language): { title: string; description: string }`, `seoFor(lang: Language): LocaleSeo` where `LocaleSeo = { lang: Language; canonical: string; alternates: readonly { hreflang: string; href: string }[]; ogLocale: string }`

- [ ] **Step 1: Write the failing test**

Create `src/i18n/seo.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/i18n/seo.test.ts`
Expected: FAIL — `Failed to resolve import "./seo"`.

- [ ] **Step 3: Write the implementation**

Create `src/i18n/seo.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/i18n/seo.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/seo.ts src/i18n/seo.test.ts
git commit -m "feat(i18n): add locale SEO module with reciprocal hreflang"
```

---

### Task 2: Convert the nine island components to a `lang` prop

All nine share one identical pattern, so this is a single mechanical sweep — a reviewer would not accept four and reject five. `useTranslations(lang)` already accepts an explicit language, so no change to `utils.ts` is needed yet and the components keep working throughout.

**Files:**
- Modify: `src/components/StudioNav.tsx`, `StudioHero.tsx`, `StudioAI.tsx`, `StudioCases.tsx`, `StudioProcess.tsx`, `StudioServices.tsx`, `StudioTrust.tsx`, `StudioContact.tsx`, `StudioFooter.tsx`
- Test: the matching `src/components/*.test.tsx` for each, plus `StudioCases.variants.test.tsx`

**Interfaces:**
- Consumes: `Language` from `src/i18n/translations.ts`; `useTranslations(lang)` from `src/i18n/utils.ts`
- Produces: every island's default export takes `{ lang }: { lang: Language }`. `StudioNav` additionally forwards it as `<LanguageToggle lang={lang} />` (Task 3 gives the toggle that prop).

- [ ] **Step 1: Update the tests to pass `lang` explicitly**

Every existing component test renders with no props, e.g. `render(<StudioServices />)`. Add the prop. In `StudioServices.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioServices from './StudioServices';

describe('StudioServices', () => {
  it('renders the four outcome pillars in Spanish', () => {
    render(<StudioServices lang="es" />);
    expect(screen.getByText('IA aplicada')).toBeInTheDocument();
    expect(screen.getByText('Automatizaciones')).toBeInTheDocument();
    const section = screen.getByText('IA aplicada').closest('section');
    expect(section).toHaveAttribute('id', 'services');
  });

  it('renders the four outcome pillars in English', () => {
    render(<StudioServices lang="en" />);
    expect(screen.getByText('Applied AI')).toBeInTheDocument();
    expect(screen.getByText('Automations')).toBeInTheDocument();
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioServices lang="en" />);
    expect(container.textContent).not.toContain('IA aplicada');
  });
});
```

Note the tightening: the current assertions use regex alternation (`/IA aplicada|Applied AI/i`), which passes in either language and therefore proves nothing about i18n. Exact per-locale strings are what make these tests meaningful.

Apply that same three-test shape (Spanish renders, English renders, no leakage) to the other eight test files. These are the verified anchor strings — each is the section's own heading, taken from `src/i18n/translations.ts`:

| Test file | Key | Spanish | English |
| --- | --- | --- | --- |
| `StudioNav.test.tsx` | `nav.services` | `Servicios` | `Services` |
| `StudioHero.test.tsx` | `hero.title.line1` | `Del concepto` | `From concept` |
| `StudioAI.test.tsx` | `ai.title` | `Definamos tu proyecto` | `Let's define your project` |
| `StudioProcess.test.tsx` | `process.title` | `Del concepto a la realidad, paso a paso` | `From concept to reality, step by step` |
| `StudioCases.test.tsx` | `cases.title` | `Del concepto a la realidad` | `From concept to reality` |
| `StudioTrust.test.tsx` | `trust.title` | `Confían en nosotros` | `Trusted by` |
| `StudioContact.test.tsx` | `contact.title` | `Contanos tu proyecto` | `Tell us about your project` |
| `StudioFooter.test.tsx` | `footer.tagline` | `Llevamos tus ideas digitales del concepto a la realidad.` | `We turn your digital ideas from concept into reality.` |

For the leakage assertion, use the *other* locale's string from the same row.

Two cautions when picking any additional assertion of your own: several strings are identical across locales (`process.steps.idea.title` is `Idea` in both, `Performance` likewise), so they cannot distinguish languages — do not anchor a locale test on those. And `StudioCases.variants.test.tsx` renders `StudioCases` too; it needs the `lang` prop added but keeps its existing variant assertions.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — TypeScript rejects the unknown `lang` prop, and the English assertions fail because every component still renders the store's hardcoded `'es'`.

- [ ] **Step 3: Convert each component**

In all nine files, delete these two imports:

```tsx
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
```

Add the `Language` type import and change the signature. The exact edit, using `StudioServices.tsx` as the template:

```tsx
// before
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';

export default function StudioServices() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

// after
import type { Language } from '../i18n/translations';
import { useTranslations } from '../i18n/utils';

export default function StudioServices({ lang }: { lang: Language }) {
  const { t } = useTranslations(lang);
```

`StudioNav.tsx` needs one extra edit — line 70 forwards the prop to the toggle:

```tsx
<LanguageToggle lang={lang} />
```

`StudioHero.tsx` keeps its existing `key={lang}` on the `<h1>` (line 264); `lang` is now a prop rather than store state, but the remount behaviour is unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS. `LanguageToggle.test.tsx` may still fail — Task 3 rewrites it.

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "refactor(i18n): pass lang as a prop to every island

A nanostore atom is module-level state, so under SSR it is shared across
concurrent requests and two simultaneous visitors on different locales
would overwrite each other's language. Astro serialises island props, so
passing lang explicitly makes server and client agree by construction."
```

---

### Task 3: Language toggle becomes navigation

With language in the URL, switching is a navigation rather than a state change. The anchors are also what let Google crawl from one locale to the other — without them the English page is undiscoverable.

**Files:**
- Modify: `src/components/LanguageToggle.tsx`
- Test: `src/components/LanguageToggle.test.tsx`

**Interfaces:**
- Consumes: `LOCALE_PATH` from `src/i18n/seo.ts` (Task 1); `Language` from `src/i18n/translations.ts`
- Produces: default export takes `{ lang }: { lang: Language }`

- [ ] **Step 1: Rewrite the test**

Replace `src/components/LanguageToggle.test.tsx` entirely:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LanguageToggle from './LanguageToggle';

describe('LanguageToggle', () => {
  it('renders a crawlable link per locale', () => {
    render(<LanguageToggle lang="es" />);
    expect(screen.getByRole('link', { name: 'Español' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en/');
  });

  it('annotates each link with the language it points to', () => {
    render(<LanguageToggle lang="es" />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('hreflang', 'en');
  });

  it('marks the active locale with aria-current', () => {
    render(<LanguageToggle lang="en" />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Español' })).not.toHaveAttribute('aria-current');
  });

  it('renders no buttons — switching locale is navigation', () => {
    render(<LanguageToggle lang="es" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/LanguageToggle.test.tsx`
Expected: FAIL — no links found; the component still renders buttons.

- [ ] **Step 3: Rewrite the component**

Replace `src/components/LanguageToggle.tsx`:

```tsx
import type { Language } from '../i18n/translations';
import { LOCALE_PATH } from '../i18n/seo';

// Segmented control: both languages are always visible and the active one is
// highlighted, so the chip reads as state instead of as a hidden action.
// The options are anchors, not buttons: language lives in the URL, and these
// links are how a crawler discovers the other locale.
const OPTIONS: ReadonlyArray<{ value: Language; code: string; name: string }> = [
  { value: 'es', code: 'ES', name: 'Español' },
  { value: 'en', code: 'EN', name: 'English' },
];

export default function LanguageToggle({ lang }: { lang: Language }) {
  return (
    <div
      role="group"
      aria-label={lang === 'es' ? 'Idioma' : 'Language'}
      className="relative grid grid-cols-2 rounded-full border border-ink-700 bg-ink-800/60 p-1"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-ember-500 transition-transform duration-300 ease-out motion-reduce:transition-none ${
          lang === 'en' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />
      {OPTIONS.map((option) => {
        const isActive = lang === option.value;
        return (
          <a
            key={option.value}
            href={LOCALE_PATH[option.value]}
            hrefLang={option.value}
            lang={option.value}
            aria-current={isActive ? 'page' : undefined}
            aria-label={option.name}
            className={`relative z-10 rounded-full px-3 py-1 text-center font-mono text-xs font-semibold tracking-wide transition-colors duration-300 motion-reduce:transition-none ${
              isActive ? 'text-ink-950' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {option.code}
          </a>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, full suite.

- [ ] **Step 5: Commit**

```bash
git add src/components/LanguageToggle.tsx src/components/LanguageToggle.test.tsx
git commit -m "feat(i18n): make the language toggle navigate between locales"
```

---

### Task 4: Require `lang` and delete the store

Now that no caller relies on the implicit fallback, close the door. This is the step that turns a silent content bug into a compile error.

**Files:**
- Modify: `src/i18n/utils.ts`
- Delete: `src/i18n/store.ts`
- Test: `src/i18n/utils.test.ts` (create)

**Interfaces:**
- Produces: `t(key: string, lang: Language): string` and `useTranslations(lang: Language): { t: (key: string) => string; lang: Language }` — `lang` required on both.

- [ ] **Step 1: Write the failing test**

Create `src/i18n/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { t, useTranslations } from './utils';

describe('t', () => {
  it('resolves a nested key in the requested language', () => {
    expect(t('services.pillars.ai.title', 'es')).toBe('IA aplicada');
    expect(t('services.pillars.ai.title', 'en')).toBe('Applied AI');
  });

  it('returns the key unchanged when it does not resolve', () => {
    expect(t('nope.not.here', 'es')).toBe('nope.not.here');
  });
});

describe('useTranslations', () => {
  it('binds t to the given language', () => {
    const { t: translate, lang } = useTranslations('en');
    expect(lang).toBe('en');
    expect(translate('services.pillars.ai.title')).toBe('Applied AI');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/i18n/utils.test.ts`
Expected: FAIL — the file does not exist yet. If the literal strings differ from `src/i18n/translations.ts`, correct the test to the real values rather than changing the translations.

- [ ] **Step 3: Make `lang` required and drop the store**

Replace `src/i18n/utils.ts`:

```ts
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
```

Then delete the store, which now has no consumer:

```bash
git rm src/i18n/store.ts
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS. Any remaining failure naming `../i18n/store` is a component Task 2 missed — fix it there and rerun.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/utils.ts src/i18n/utils.test.ts
git commit -m "refactor(i18n): require lang and remove the language store

Optional lang let a missed call site fall back to global state and render
the wrong language silently. Required makes it a compile error."
```

---

### Task 5: Layout renders its head from the SEO module

Closes audit findings 1 (stale description), 3 (invalid hreflang), 5 (query-param leak in canonical) and 11 (dead `meta keywords`), and removes the `Accept-Language` negotiation behind finding 3's split-brain page.

**Files:**
- Modify: `src/layouts/Layout.astro`

**Interfaces:**
- Consumes: `seoFor` from `src/i18n/seo.ts`
- Produces: `Layout` props are `{ lang: Language; title: string; description: string }` — all three required.

- [ ] **Step 1: Rewrite the frontmatter**

Replace lines 1–44 of `src/layouts/Layout.astro`:

```astro
---
import '../styles/global.css';
import { Analytics } from '@vercel/analytics/react';
import { seoFor } from '../i18n/seo';
import type { Language } from '../i18n/translations';

export interface Props {
  lang: Language;
  title: string;
  description: string;
}

// All three are required. The previous Props had no `description`, so pages
// could not supply one and the layout silently fell back to stale
// pre-redesign copy that contradicted the title.
const { lang, title, description } = Astro.props;

// Derived from path constants, never from Astro.url: the request URL used to
// leak tracking parameters straight into rel=canonical.
const { canonical, alternates, ogLocale } = seoFor(lang);
const logoUrl = new URL('/logoMadezdev-2.png', canonical).toString();
---
```

The removed `Accept-Language` block (old lines 15–21) is not replaced. It set `<html lang>` and the title from a header the React islands never saw, producing an English shell around a Spanish body.

- [ ] **Step 2: Rewrite the head**

In the same file, replace the head so it uses the derived values. The canonical, alternates and og/twitter URL blocks become:

```astro
<link rel="canonical" href={canonical} />
{alternates.map((alt) => (
  <link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
))}
```

```astro
<meta property="og:url" content={canonical} />
<meta property="og:locale" content={ogLocale} />
```

```astro
<meta name="twitter:url" content={canonical} />
```

Delete outright:
- `<meta name="keywords" content={keywords} />` — Google has ignored it since 2009.
- The old two-line hreflang block that pointed both `es` and `en` at the same URL.
- The `import { currentLanguage }` on line 2 — unused even before this change.
- The inline `<script>` at lines 91–100 that subscribed to the store to set `document.documentElement.lang`. `<html lang>` is now correct in the served HTML and must not be mutated afterwards.

Keep unchanged: charset, viewport, author, robots, `google-site-verification`, icons, manifest, theme-color, generator, the font preconnects and stylesheet, and `<Analytics />`.

- [ ] **Step 3: Verify the layout typechecks**

Run: `npx astro check`
Expected: errors reported for `src/pages/index.astro` only — it still passes the old props and does not yet supply `description`. Task 6 fixes it. Any error inside `Layout.astro` itself must be resolved now.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "fix(seo): derive canonical and hreflang from the locale module

Replaces a hreflang pair that pointed both language codes at the same URL,
a canonical built from Astro.url that leaked query strings, and a stale
fallback description that contradicted the page title."
```

---

### Task 6: The two locale routes

**Files:**
- Create: `src/components/StudioPage.astro`, `src/pages/en/index.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Layout` props from Task 5; `pageMeta` from `src/i18n/seo.ts`; every island's `lang` prop from Tasks 2–3
- Produces: prerendered `/` and `/en/`

- [ ] **Step 1: Extract the shared island composition**

Create `src/components/StudioPage.astro`:

```astro
---
import StudioNav from './StudioNav.tsx';
import StudioHero from './StudioHero.tsx';
import StudioAI from './StudioAI.tsx';
import StudioServices from './StudioServices.tsx';
import StudioProcess from './StudioProcess.tsx';
import StudioCases from './StudioCases.tsx';
import StudioTrust from './StudioTrust.tsx';
import StudioContact from './StudioContact.tsx';
import StudioFooter from './StudioFooter.tsx';
import type { Language } from '../i18n/translations';

interface Props {
  lang: Language;
}

const { lang } = Astro.props;
---

<StudioNav client:idle lang={lang} />
<main>
  <!-- client:load, not client:visible: the hero is above the fold and its
       ignition sequence should not wait on an IntersectionObserver. -->
  <StudioHero client:load lang={lang} />
  <StudioAI client:visible lang={lang} />
  <StudioServices client:visible lang={lang} />
  <StudioProcess client:visible lang={lang} />
  <StudioCases client:visible lang={lang} />
  <StudioTrust client:visible lang={lang} />
  <StudioContact client:visible lang={lang} />
</main>
<StudioFooter client:visible lang={lang} />
```

- [ ] **Step 2: Rewrite the Spanish route**

Replace `src/pages/index.astro` entirely:

```astro
---
import Layout from '../layouts/Layout.astro';
import StudioPage from '../components/StudioPage.astro';
import { pageMeta, seoFor } from '../i18n/seo';

// Static HTML: nothing on this page depends on the request. The API routes
// under /api stay server-rendered.
export const prerender = true;

const lang = 'es' as const;
const { title, description } = pageMeta(lang);

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'madezdev',
  url: seoFor(lang).canonical,
  description,
  sameAs: [
    'https://github.com/madezdev',
    'https://www.linkedin.com/company/madezdev',
  ],
};
---

<Layout lang={lang} title={title} description={description}>
  <StudioPage lang={lang} />
  <script type="application/ld+json" set:html={JSON.stringify(orgJsonLd)} />
</Layout>
```

- [ ] **Step 3: Add the English route**

Create `src/pages/en/index.astro`:

```astro
---
import Layout from '../../layouts/Layout.astro';
import StudioPage from '../../components/StudioPage.astro';
import { pageMeta, seoFor } from '../../i18n/seo';

export const prerender = true;

const lang = 'en' as const;
const { title, description } = pageMeta(lang);

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'madezdev',
  url: seoFor(lang).canonical,
  description,
  sameAs: [
    'https://github.com/madezdev',
    'https://www.linkedin.com/company/madezdev',
  ],
};
---

<Layout lang={lang} title={title} description={description}>
  <StudioPage lang={lang} />
  <script type="application/ld+json" set:html={JSON.stringify(orgJsonLd)} />
</Layout>
```

- [ ] **Step 4: Verify**

Run: `npx astro check`
Expected: no errors.

Run: `npm test`
Expected: PASS, full suite.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/pages/en/index.astro src/components/StudioPage.astro
git commit -m "feat(seo): serve English at /en/ as a prerendered route

Spanish stays at / so the already-indexed canonical does not move. Both
routes prerender to static HTML, so the CDN can cache what was previously
an SSR function call on every request."
```

---

### Task 7: Crawl files

**Files:**
- Create: `public/robots.txt`, `public/sitemap.xml`

- [ ] **Step 1: Add robots.txt**

Create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://www.madez.dev/sitemap.xml
```

- [ ] **Step 2: Add the sitemap**

Create `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.madez.dev/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.madez.dev/en/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

No `xhtml:link` alternates here, deliberately. hreflang may be declared in HTML or in the sitemap, but when the two disagree Google discards the conflicting pair. The HTML annotations from Task 5 are sufficient for two URLs, and a single source of truth cannot drift out of sync with itself.

- [ ] **Step 3: Commit**

```bash
git add public/robots.txt public/sitemap.xml
git commit -m "feat(seo): add robots.txt and sitemap

Both returned 404 in production, so neither locale was discoverable
outside of direct linking."
```

---

## Post-deploy verification

Not part of implementation — run these against the preview URL, then production.

- [ ] `curl -sI <url>/` shows `x-vercel-cache: HIT` on a second request, replacing today's permanent `MISS`.
- [ ] `curl -s -o /dev/null -w "%{http_code}" <url>/robots.txt` and `.../sitemap.xml` both return 200.
- [ ] `curl -s "<url>/?utm_source=test" | rg -o '<link rel="canonical"[^>]*>'` contains no `?`.
- [ ] `curl -s <url>/en/ | rg -o '<html lang="[a-z]*"|<h1[^>]*>.{0,60}'` shows `lang="en"` **and** an English `<h1>` — the split-brain regression.
- [ ] Both pages emit all three hreflang entries: `curl -s <url>/ | rg -o 'hreflang="[^"]*" href="[^"]*"'` and the same for `/en/`, with identical output.
- [ ] After merge: submit `sitemap.xml` in Search Console and request indexing for `/en/`.
