# madezdev Redesign — Phase A: Foundations + Design System + Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the freelancer shell of portfolio-mh with the madezdev studio foundation — design tokens (ink base + signature orange), typography, motion guardrails, a restructured i18n layer, and the rebuilt Nav / Hero / Footer — leaving a deployable, restyled skeleton.

**Architecture:** Keep Astro 5 SSR + React 19 + Tailwind 4 (CSS-first `@theme`) + Vercel. Introduce a Tailwind `@theme` token system encoding the "concept → reality" color story. Add the Motion library and a testable reduced-motion guardrail. Convert blanket `client:load` hydration to selective islands. Rebuild only the shell sections (Nav, Hero, Footer) in this phase; content sections (Servicios, Casos, etc.) and the AI front door come in Phases B–D.

**Tech Stack:** Astro 5.12, React 19.1, TailwindCSS 4.1 (`@theme`), Motion (`motion/react`), nanostores i18n, Vitest + @testing-library/react + jsdom, Vercel adapter.

## Global Constraints

- **Language of artifacts:** code, identifiers, comments in English. **UI copy is Spanish-first (ES default) + English translation** — the site ships bilingual via the existing nanostore i18n. Copy strings live in `src/i18n/translations.ts`.
- **Identity:** studio "we" (nosotros). Never freelancer / first-person-singular in copy.
- **Tagline (verbatim):** `Del concepto a la realidad.`
- **Signature accent:** orange/amber (`--color-ember-*`). Do NOT reintroduce the blue→purple gradient.
- **Motion:** every animation honors `prefers-reduced-motion`; 60fps; degrade on mobile; motion only in lazy islands.
- **Hydration:** no blanket `client:load`. Static shell is SSR/no-JS; interactive pieces use `client:visible` / `client:idle`.
- **SEO preserved:** keep the Google Search Console verification meta and canonical/hreflang tags in `Layout.astro`. Hero stays server-rendered/indexable.
- **Do NOT run `astro build`** during implementation (project rule). Verify via `vitest` and `npm run dev`.
- **Commits:** conventional commits, no AI attribution.
- **Tailwind 4:** CSS-first. Tokens go in `src/styles/global.css` under `@theme`. No `tailwind.config`. No `var()` inside `className` — use generated utilities.

---

### Task 1: Test tooling + Motion dependency

**Files:**
- Modify: `package.json` (add devDependencies + scripts)
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.ts`

**Interfaces:**
- Produces: a working `npm test` (Vitest, jsdom env, `@testing-library/jest-dom` matchers) that every later task's tests rely on; the `motion` package available as `motion/react`.

- [ ] **Step 1: Add dependencies and scripts to `package.json`**

Add a `devDependencies` block and two scripts. Add `motion` to `dependencies`.

```jsonc
// dependencies — add:
"motion": "^11.15.0",

// add a new top-level "devDependencies" block:
"devDependencies": {
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.1.0",
  "@testing-library/user-event": "^14.5.2",
  "@vitejs/plugin-react": "^4.3.4",
  "jsdom": "^25.0.1",
  "vitest": "^2.1.8"
}

// scripts — add:
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: installs without peer-dependency errors; `node_modules/motion` and `node_modules/vitest` exist.

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Create the smoke test `src/test/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: PASS — 1 passed (smoke).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/
git commit -m "chore: add vitest test harness and motion dependency"
```

---

### Task 2: `usePrefersReducedMotion` guardrail hook

**Files:**
- Create: `src/hooks/usePrefersReducedMotion.ts`
- Test: `src/hooks/usePrefersReducedMotion.test.tsx`

**Interfaces:**
- Produces: `usePrefersReducedMotion(): boolean` — `true` when the user prefers reduced motion. Every motion island consumes this to gate animations.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('usePrefersReducedMotion', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns true when the user prefers reduced motion', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false when the user does not prefer reduced motion', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/usePrefersReducedMotion.test.tsx`
Expected: FAIL — cannot find module `./usePrefersReducedMotion`.

- [ ] **Step 3: Write the implementation**

```ts
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Returns true when the user has requested reduced motion.
 * SSR-safe: defaults to `true` (no motion) until mounted, so the
 * server render never assumes animation.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setPrefersReduced(mql.matches);

    const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return prefersReduced;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/usePrefersReducedMotion.test.tsx`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePrefersReducedMotion.ts src/hooks/usePrefersReducedMotion.test.tsx
git commit -m "feat: add usePrefersReducedMotion guardrail hook"
```

---

### Task 3: Design tokens (`@theme`) — the concept→reality color system

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: Tailwind utilities used by every later component: colors `ink-{950,900,800,700}`, `ember-{300,400,500,600}`, `blueprint-{300,400}`, `fg`, `fg-muted`; fonts `font-display`, `font-sans`, `font-mono`.

> These hex values are concrete starting points. During the visual-QA steps (Tasks 7–9) they are refined with the `ui-ux-pro-max` / `frontend-design` skills — but they are real, working values now, not placeholders.

- [ ] **Step 1: Replace `src/styles/global.css` with the token system**

```css
@import "tailwindcss";

@theme {
  /* Base — deep, slightly warm ink (not the bluish slate-950) */
  --color-ink-950: #0a0a0b;
  --color-ink-900: #111113;
  --color-ink-800: #1a1a1e;
  --color-ink-700: #26262c;

  /* Signature accent — electric orange / amber (the brand mark color) */
  --color-ember-600: #e5551a;
  --color-ember-500: #ff6a1a;
  --color-ember-400: #ff8a3d;
  --color-ember-300: #ffb37a;

  /* Concept / blueprint — cool tones used sparingly at the "top" of the journey */
  --color-blueprint-400: #6b8aff;
  --color-blueprint-300: #9db0ff;

  /* Foreground */
  --color-fg: #f5f5f4;
  --color-fg-muted: #a1a1aa;

  /* Typography */
  --font-display: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;
}

html {
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Verify tokens compile into utilities**

Run: `npm run dev`
Expected: dev server boots with no CSS errors. In a scratch element, `class="bg-ink-950 text-ember-500 font-display"` renders near-black background + orange text + Space Grotesk (fallback until Task 4 loads the font). Stop the server after verifying.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add concept-to-reality design tokens (ink + ember + blueprint)"
```

---

### Task 4: Typography loading + base theme swap in `Layout.astro`

**Files:**
- Modify: `src/layouts/Layout.astro`

**Interfaces:**
- Consumes: fonts declared in Task 3 tokens (`Space Grotesk`, `Inter`, `JetBrains Mono`).
- Produces: the three font families loaded; body on the new ink base; `theme-color` updated. Preserves all existing SEO tags.

- [ ] **Step 1: Replace the Google Fonts `<link>` (keep the two `preconnect` lines above it)**

Replace the single Inter `<link href="https://fonts.googleapis.com/css2?family=Inter...">` line with:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Space+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Update the `theme-color` meta**

Replace `<meta name="theme-color" content="#0f172a" />` with:

```html
<meta name="theme-color" content="#0a0a0b" />
```

- [ ] **Step 3: Swap the body base classes**

Replace `<body class="bg-slate-950 text-white font-sans antialiased">` with:

```html
<body class="bg-ink-950 text-fg font-sans antialiased">
```

- [ ] **Step 4: Remove the dead `const t = translations[lang];` line and its now-unused import**

In the frontmatter, delete the line `const t = translations[lang];` and change the import line `import { translations } from '../i18n/translations';` — it is no longer used, remove it. (Leave the `currentLanguage` import and the `<script>` block untouched.)

- [ ] **Step 5: Update the inline `<style>` font-family fallback**

Replace the trailing `<style> html { font-family: 'Inter', system-ui, sans-serif; } </style>` with:

```html
<style>
	html {
		font-family: var(--font-sans);
	}
</style>
```

- [ ] **Step 6: Verify**

Run: `npm run dev`
Expected: page loads on near-black `#0a0a0b` background; body text renders in Inter; no console errors; the Search Console verification meta is still present in view-source. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: load studio typography and swap to ink base theme"
```

---

### Task 5: i18n — studio shell namespaces (brand, nav, hero, footer)

**Files:**
- Modify: `src/i18n/translations.ts`
- Test: `src/i18n/translations.test.ts`

**Interfaces:**
- Consumes: `t(key)` / `useTranslations` from `src/i18n/utils.ts` (unchanged).
- Produces: new/rewritten namespaces `brand`, `nav`, `hero`, `footer` under both `es` and `en`, with symmetric shape. Keys consumed by Tasks 7–9.

> This task ADDS the studio shell copy and fixes the `hero.title` asymmetry (en had a `line3` the es lacked). The old `about`, `services`, `skills`, `contact` namespaces stay in the file for now — Phases B/C rewrite them. Only `nav`, `hero`, `footer` are replaced here, plus a new `brand`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { translations } from './translations';
import { t } from './utils';

describe('studio shell translations', () => {
  it('exposes the studio tagline verbatim in both languages', () => {
    expect(t('hero.title.line2', 'es')).toBe('la realidad');
    expect(t('brand.name', 'es')).toBe('madezdev');
    expect(t('brand.name', 'en')).toBe('madezdev');
  });

  it('has a symmetric hero.title shape across languages', () => {
    expect(Object.keys(translations.es.hero.title).sort())
      .toEqual(Object.keys(translations.en.hero.title).sort());
  });

  it('uses first-person-plural studio copy, not freelancer singular', () => {
    expect(t('hero.subtitle', 'es').toLowerCase()).toContain('construimos');
    expect(t('nav.contactCta', 'es')).toBe('Agendá una llamada');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/i18n/translations.test.ts`
Expected: FAIL — `brand` undefined / `hero.title.line2` mismatch.

- [ ] **Step 3: Rewrite the `nav`, `hero`, `footer` namespaces and add `brand` (ES)**

In `translations.ts`, under `es:`, add a `brand` namespace and replace `nav`, `hero`, `footer`:

```ts
brand: {
  name: 'madezdev',
  tagline: 'Del concepto a la realidad.',
},
nav: {
  services: 'Servicios',
  cases: 'Casos',
  process: 'Proceso',
  contactCta: 'Agendá una llamada',
},
hero: {
  eyebrow: 'Estudio de producto digital',
  title: {
    line1: 'Del concepto',
    line2: 'la realidad',
  },
  subtitle: 'Diseñamos y construimos productos, SaaS y automatizaciones con IA — de la idea a producción.',
  cta: {
    primary: 'Definí tu proyecto',
    secondary: 'Ver casos',
  },
},
footer: {
  tagline: 'Llevamos tus ideas digitales del concepto a la realidad.',
  navTitle: 'Navegación',
  servicesTitle: 'Servicios',
  rights: 'Todos los derechos reservados.',
  builtWith: 'Diseñado y construido por madezdev.',
},
```

- [ ] **Step 4: Rewrite the same namespaces (EN)**

Under `en:`, add `brand` and replace `nav`, `hero`, `footer`:

```ts
brand: {
  name: 'madezdev',
  tagline: 'From concept to reality.',
},
nav: {
  services: 'Services',
  cases: 'Work',
  process: 'Process',
  contactCta: 'Book a call',
},
hero: {
  eyebrow: 'Digital product studio',
  title: {
    line1: 'From concept',
    line2: 'to reality',
  },
  subtitle: 'We design and build products, SaaS, and AI automations — from idea to production.',
  cta: {
    primary: 'Define your project',
    secondary: 'See our work',
  },
},
footer: {
  tagline: 'We turn your digital ideas from concept into reality.',
  navTitle: 'Navigation',
  servicesTitle: 'Services',
  rights: 'All rights reserved.',
  builtWith: 'Designed and built by madezdev.',
},
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/i18n/translations.test.ts`
Expected: PASS — 3 passed. (If the es `line2` copy differs, align the test and copy — the assertion documents the intended verbatim value `'la realidad'`.)

- [ ] **Step 6: Commit**

```bash
git add src/i18n/translations.ts src/i18n/translations.test.ts
git commit -m "feat: add studio shell i18n (brand, nav, hero, footer) with symmetric shape"
```

---

### Task 6: Shared layout primitives

**Files:**
- Create: `src/components/primitives/Section.tsx`
- Create: `src/components/primitives/Container.tsx`
- Create: `src/components/primitives/BlueprintGrid.tsx`
- Test: `src/components/primitives/Section.test.tsx`

**Interfaces:**
- Produces:
  - `Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }): JSX.Element` — vertical rhythm wrapper (`py-24`), renders a `<section>`.
  - `Container({ children, className }: { children: ReactNode; className?: string }): JSX.Element` — `max-w-6xl mx-auto px-6`.
  - `BlueprintGrid({ className }: { className?: string }): JSX.Element` — decorative, `aria-hidden` cool grid backdrop (the "concept" texture).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Section } from './Section';

describe('Section', () => {
  it('renders a section with the given id and children', () => {
    render(<Section id="hero">hello</Section>);
    const section = screen.getByText('hello').closest('section');
    expect(section).toHaveAttribute('id', 'hero');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/primitives/Section.test.tsx`
Expected: FAIL — cannot find module `./Section`.

- [ ] **Step 3: Implement `Container.tsx`**

```tsx
import type { ReactNode } from 'react';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-6xl mx-auto px-6 ${className}`}>{children}</div>;
}
```

- [ ] **Step 4: Implement `Section.tsx`**

```tsx
import type { ReactNode } from 'react';

export function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative py-24 ${className}`}>
      {children}
    </section>
  );
}
```

- [ ] **Step 5: Implement `BlueprintGrid.tsx`**

```tsx
export function BlueprintGrid({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(107,138,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(107,138,255,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at 50% 0%, black 40%, transparent 75%)',
      }}
    />
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/primitives/Section.test.tsx`
Expected: PASS — 1 passed.

- [ ] **Step 7: Commit**

```bash
git add src/components/primitives/
git commit -m "feat: add Section, Container, and BlueprintGrid primitives"
```

---

### Task 7: Rebuild Navigation (studio)

**Files:**
- Create: `src/components/StudioNav.tsx`
- Test: `src/components/StudioNav.test.tsx`

**Interfaces:**
- Consumes: `useStore(currentLanguage)`, `useTranslations`, i18n keys `brand.name`, `nav.services|cases|process|contactCta`; existing `LanguageToggle.tsx`.
- Produces: `<StudioNav />` default export — sticky top nav.

**Design note:** invoke the `frontend-design` skill before styling to lock the nav's visual language (glass on scroll, ember CTA). This task's TDD covers structure/content/a11y; visual polish is a design-skill step.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioNav from './StudioNav';

describe('StudioNav', () => {
  it('renders the studio brand and the primary CTA', () => {
    render(<StudioNav />);
    expect(screen.getByText('madezdev')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /agendá una llamada|book a call/i })).toBeInTheDocument();
  });

  it('links the CTA to the contact anchor', () => {
    render(<StudioNav />);
    const cta = screen.getByRole('link', { name: /agendá una llamada|book a call/i });
    expect(cta).toHaveAttribute('href', '#contact');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/StudioNav.test.tsx`
Expected: FAIL — cannot find module `./StudioNav`.

- [ ] **Step 3: Implement `StudioNav.tsx`**

```tsx
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import LanguageToggle from './LanguageToggle';

export default function StudioNav() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  const links = [
    { href: '#services', label: t('nav.services') },
    { href: '#cases', label: t('nav.cases') },
    { href: '#process', label: t('nav.process') },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-ink-950/70 backdrop-blur-md border-b border-ink-800">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="font-display text-lg font-bold tracking-tight text-fg">
          {t('brand.name')}
        </a>
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-fg-muted hover:text-fg transition-colors">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <a
            href="#contact"
            className="rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-ember-400 transition-colors"
          >
            {t('nav.contactCta')}
          </a>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/StudioNav.test.tsx`
Expected: PASS — 2 passed.

- [ ] **Step 5: Visual QA + design-skill polish**

Invoke `frontend-design`. Run `npm run dev`, confirm: sticky, readable over content, ember CTA legible on ink, `LanguageToggle` works, keyboard-focusable links. Refine tokens/spacing as the skill directs. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/components/StudioNav.tsx src/components/StudioNav.test.tsx
git commit -m "feat: rebuild navigation as studio nav"
```

---

### Task 8: Rebuild Hero ("El concepto") with kinetic type

**Files:**
- Create: `src/components/StudioHero.tsx`
- Test: `src/components/StudioHero.test.tsx`

**Interfaces:**
- Consumes: `useStore(currentLanguage)`, `useTranslations`, i18n keys `hero.eyebrow|title.line1|title.line2|subtitle|cta.primary|cta.secondary`; `usePrefersReducedMotion` (Task 2); `BlueprintGrid`, `Container` (Task 6); `motion/react`.
- Produces: `<StudioHero />` default export — the SSR-friendly hero; word "realidad/reality" (line2) is the ember-accented kinetic element.

**Design note:** the hero is the signature first impression. Invoke `frontend-design` + `motion-graphics` to lock the kinetic-type treatment and the concept→reality color temperature. TDD below covers content/structure/reduced-motion; the animation curves are a design-skill step. Content (headline, subtitle, CTAs) must render server-side with NO motion dependency so it is indexable and works before hydration.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioHero from './StudioHero';

vi.mock('../hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true, // assert static content renders even with motion off
}));

describe('StudioHero', () => {
  it('renders the full tagline and both CTAs as real links', () => {
    render(<StudioHero />);
    expect(screen.getByText(/del concepto|from concept/i)).toBeInTheDocument();
    expect(screen.getByText(/la realidad|to reality/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /definí tu proyecto|define your project/i }))
      .toHaveAttribute('href', '#ai');
    expect(screen.getByRole('link', { name: /ver casos|see our work/i }))
      .toHaveAttribute('href', '#cases');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/StudioHero.test.tsx`
Expected: FAIL — cannot find module `./StudioHero`.

- [ ] **Step 3: Implement `StudioHero.tsx`**

```tsx
import { useStore } from '@nanostores/react';
import { motion } from 'motion/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { Container } from './primitives/Container';
import { BlueprintGrid } from './primitives/BlueprintGrid';

export default function StudioHero() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const reduced = usePrefersReducedMotion();

  const line2Motion = reduced
    ? {}
    : { initial: { opacity: 0, y: '0.3em' }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } };

  return (
    <section id="top" className="relative min-h-[92vh] flex items-center overflow-hidden">
      <BlueprintGrid />
      <Container className="relative z-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-6">
          {t('hero.eyebrow')}
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05]">
          <span className="block text-fg">{t('hero.title.line1')}</span>
          <motion.span className="block text-ember-500" {...line2Motion}>
            {t('hero.title.line2')}
          </motion.span>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-fg-muted leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#ai"
            className="rounded-full bg-ember-500 px-8 py-4 font-semibold text-ink-950 hover:bg-ember-400 transition-colors"
          >
            {t('hero.cta.primary')}
          </a>
          <a
            href="#cases"
            className="rounded-full border border-ink-700 px-8 py-4 font-semibold text-fg hover:bg-ink-800 transition-colors"
          >
            {t('hero.cta.secondary')}
          </a>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/StudioHero.test.tsx`
Expected: PASS — 1 passed.

- [ ] **Step 5: Visual QA + design-skill polish**

Invoke `frontend-design` + `motion-graphics`. Run `npm run dev`, confirm: headline reads powerfully, ember "realidad" pops on ink, kinetic entrance plays once and respects reduced-motion (toggle OS setting → no animation, content still visible), blueprint grid subtle, mobile layout intact. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/components/StudioHero.tsx src/components/StudioHero.test.tsx
git commit -m "feat: rebuild hero with concept-to-reality kinetic type"
```

---

### Task 9: Rebuild Footer (studio, real data)

**Files:**
- Create: `src/components/StudioFooter.tsx`
- Test: `src/components/StudioFooter.test.tsx`

**Interfaces:**
- Consumes: `useStore`, `useTranslations`, i18n keys `brand.name|tagline`, `footer.*`; the real social handles (`madezdev`).
- Produces: `<StudioFooter />` default export. Uses the real current year via `new Date().getFullYear()` (fixes the hardcoded "© 2024"). Uses real handles (fixes the `martin-dev` placeholders).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioFooter from './StudioFooter';

describe('StudioFooter', () => {
  it('renders the studio brand and the real current year', () => {
    render(<StudioFooter />);
    expect(screen.getByText('madezdev')).toBeInTheDocument();
    const year = String(new Date().getFullYear());
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('uses the real GitHub handle, not the placeholder', () => {
    render(<StudioFooter />);
    const gh = screen.getByRole('link', { name: /github/i });
    expect(gh.getAttribute('href')).toContain('madezdev');
    expect(gh.getAttribute('href')).not.toContain('martin-dev');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/StudioFooter.test.tsx`
Expected: FAIL — cannot find module `./StudioFooter`.

- [ ] **Step 3: Implement `StudioFooter.tsx`**

```tsx
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';

const SOCIALS = [
  { name: 'GitHub', href: 'https://github.com/madezdev' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/madezdev' },
];

export default function StudioFooter() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="max-w-sm">
            <p className="font-display text-lg font-bold text-fg">{t('brand.name')}</p>
            <p className="mt-3 text-sm text-fg-muted">{t('footer.tagline')}</p>
          </div>
          <nav className="flex gap-6" aria-label={t('footer.navTitle')}>
            {SOCIALS.map((s) => (
              <a key={s.name} href={s.href} className="text-sm text-fg-muted hover:text-ember-400 transition-colors" target="_blank" rel="noopener noreferrer">
                {s.name}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col sm:flex-row justify-between gap-2 text-xs text-fg-muted">
          <p>© {year} {t('brand.name')}. {t('footer.rights')}</p>
          <p>{t('footer.builtWith')}</p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/StudioFooter.test.tsx`
Expected: PASS — 2 passed. (Confirm the real handles: adjust the `SOCIALS` hrefs to the owner's actual GitHub/LinkedIn URLs.)

- [ ] **Step 5: Commit**

```bash
git add src/components/StudioFooter.tsx src/components/StudioFooter.test.tsx
git commit -m "feat: rebuild footer with studio identity and real data"
```

---

### Task 10: Rewire `index.astro` — composition, islands, SEO, JSON-LD

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `StudioNav`, `StudioHero`, `StudioFooter`.
- Produces: the deployable Phase-A shell page. Old sections (`About`, `Services`, `TeamWork`, `Skills`, `Contact`) are removed from the page composition (files stay in the repo; Phases B/C replace them). Placeholder anchor sections `#ai`, `#services`, `#cases`, `#process`, `#contact` are added so the hero/nav CTAs resolve without dead links.

- [ ] **Step 1: Replace `src/pages/index.astro` frontmatter + composition**

```astro
---
import Layout from '../layouts/Layout.astro';
import StudioNav from '../components/StudioNav.tsx';
import StudioHero from '../components/StudioHero.tsx';
import StudioFooter from '../components/StudioFooter.tsx';

// Determine language from request headers for SEO
let lang: 'es' | 'en' = 'es';
if (Astro.request.headers.get('accept-language')?.includes('en')) {
	lang = 'en';
}

const seoContent = {
	es: {
		title: 'madezdev — Estudio de producto digital | Del concepto a la realidad',
		description: 'Estudio que diseña y construye productos web, SaaS y automatizaciones con IA. Del concepto a la realidad.'
	},
	en: {
		title: 'madezdev — Digital product studio | From concept to reality',
		description: 'A studio that designs and builds web products, SaaS, and AI automations. From concept to reality.'
	}
};

const orgJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: 'madezdev',
	url: 'https://www.madez.dev',
	description: seoContent[lang].description,
	sameAs: [
		'https://github.com/madezdev',
		'https://www.linkedin.com/company/madezdev'
	]
};
---

<Layout title={seoContent[lang].title} lang={lang}>
	<StudioNav client:idle />
	<main>
		<StudioHero client:visible />
		<!-- Phase B/C placeholder anchors so hero/nav CTAs resolve -->
		<section id="ai" class="min-h-[40vh]"></section>
		<section id="services" class="min-h-[40vh]"></section>
		<section id="process" class="min-h-[40vh]"></section>
		<section id="cases" class="min-h-[40vh]"></section>
		<section id="contact" class="min-h-[40vh]"></section>
	</main>
	<StudioFooter client:visible />
	<script type="application/ld+json" set:html={JSON.stringify(orgJsonLd)} />
</Layout>
```

- [ ] **Step 2: Verify the shell renders and hydration is selective**

Run: `npm run dev`
Expected: page shows StudioNav + StudioHero on ink base, footer at bottom; clicking "Definí tu proyecto" scrolls to `#ai`, "Ver casos" to `#cases`; view-source shows the hero content server-rendered (indexable) and the JSON-LD script present. No `client:load` remains. Stop the server.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests from Tasks 1–9 green.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: assemble Phase A studio shell with selective hydration and JSON-LD"
```

---

### Task 11: Remove the dead CookieConsent component

**Files:**
- Delete: `src/components/CookieConsent.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: removal of a dead, non-functional component (it is imported nowhere and its buttons only `console.log`). A proper consent flow, if needed for the AI data disclosure, is designed in Phase C.

- [ ] **Step 1: Confirm it is unreferenced**

Run: `rg -n "CookieConsent" src` (use ripgrep)
Expected: matches only inside `src/components/CookieConsent.tsx` itself — no imports elsewhere.

- [ ] **Step 2: Delete the file**

```bash
git rm src/components/CookieConsent.tsx
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS — suite unaffected.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove dead CookieConsent component"
```

---

## Self-Review

**Spec coverage (Phase A subset):**
- Studio identity + tagline → Tasks 5, 8, 10 (copy, hero, SEO/JSON-LD). ✅
- Orange signature + ink base, kill blue→purple → Tasks 3, 4, 8. ✅
- Typography (display + grotesk + mono) → Tasks 3, 4. ✅
- Motion guardrail (reduced-motion) → Tasks 2, 8. ✅
- Selective island hydration (kill blanket `client:load`) → Task 10. ✅
- SEO preserved (Search Console meta, hero SSR) + JSON-LD → Tasks 4, 8, 10. ✅
- i18n restructure (shell namespaces, fix hero.title asymmetry) → Task 5. ✅
- Kill-list (dead CookieConsent, "© 2024", placeholder handles) → Tasks 9, 11. ✅
- Deferred to later phases (correctly OUT of Phase A): AI front door + rate limiting (Phase C), Servicios/Casos/Confianza/Proceso content + motion (Phases B/D), contact form reuse (Phase B). Old `About/Services/TeamWork/Skills/Contact` components remain in-repo until their phase replaces them.

**Placeholder scan:** hex values, font names, i18n copy, file paths, and commands are all concrete. Social hrefs (`madezdev`) and the exact es `line2` copy are flagged for owner confirmation inside their steps — real values provided, not "TODO".

**Type consistency:** `usePrefersReducedMotion(): boolean` (Task 2) consumed in Task 8; `Section`/`Container`/`BlueprintGrid` signatures (Task 6) consumed in Tasks 6/8; i18n keys defined in Task 5 (`brand.*`, `nav.*`, `hero.*`, `footer.*`) match those consumed in Tasks 7/8/9; component default-export names (`StudioNav`, `StudioHero`, `StudioFooter`) match the imports in Task 10.

## Open items carried to build

- Confirm the exact ES `hero.title.line2` verbatim ("la realidad") and the real GitHub/LinkedIn URLs for the footer.
- Exact hex/type/motion curves refined via `ui-ux-pro-max` / `frontend-design` / `motion-graphics` during Tasks 7–9 visual-QA steps.
