# madezdev Redesign — Phase D: Process Narrative — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the `#process` section with the concept→reality journey — a 4-step numbered narrative (Idea → Diseño → Construcción → Producción) with a scroll-driven connector that "draws itself" from blueprint-cool to ember-warm as you descend, making the tagline literal.

**Architecture:** A `StudioProcess` React island (`client:visible`) rendering `<section id="process">`, driven by a `process` i18n namespace. Motion is CSS scroll-driven (`animation-timeline: view()`) with a `@supports` + `prefers-reduced-motion` fallback (static, fully-visible) — no JS motion library, no jsdom test friction. The elaborate cinematic tuning (sketch→polished morph, per-step affordances) is DEFERRED to the joint visual pass; this phase delivers the structural narrative + the signature connector.

**Tech Stack:** Astro 5 SSR, React 19, Tailwind 4 `@theme`, CSS scroll-driven animations, nanostores i18n, Vitest.

## Global Constraints

- Artifacts in English; **UI copy Spanish-first (ES) + English** in `src/i18n/translations.ts`.
- Studio "we" voice. Ember/ink + blueprint tokens; NO blue→purple; NO emoji-as-icons. `client:visible` island.
- Numbered markers (01–04) are appropriate here because the content IS a real sequence (the delivery process).
- Motion: honor `prefers-reduced-motion`; use `@supports (animation-timeline: view())` so unsupported browsers degrade to fully-visible static content. Color story: blueprint (concept, top) → ember (reality, bottom).
- Do NOT run `astro build`. Verify with `vitest` (+ `tsc` for the touched files). Conventional commits, no AI attribution.
- Reuse existing primitives (`Section`, `Container`) and design tokens. Static Tailwind classes only.

---

### Task 1: Process i18n namespace

**Files:**
- Modify: `src/i18n/translations.ts` (add `process` namespace to both languages)
- Test: `src/i18n/process-i18n.test.ts`

**Interfaces:**
- Produces: `process` namespace (both langs): `eyebrow, title, subtitle, steps: { idea, design, build, ship }.{ title, description }`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { translations } from './translations';

describe('process i18n', () => {
  it('defines the four journey steps in both languages', () => {
    const steps = ['idea', 'design', 'build', 'ship'];
    for (const lang of ['es', 'en'] as const) {
      expect(translations[lang].process.title).toBeTruthy();
      expect(Object.keys(translations[lang].process.steps).sort()).toEqual([...steps].sort());
    }
  });
});
```

- [ ] **Step 2: Run → RED.** `npx vitest run src/i18n/process-i18n.test.ts`

- [ ] **Step 3: Add `es.process`** (place among the existing namespaces; keep `as const` + type exports intact; touch nothing else):

```ts
process: {
  eyebrow: '// proceso',
  title: 'Del concepto a la realidad, paso a paso',
  subtitle: 'Un proceso claro: sabés qué pasa en cada etapa y ves avances seguido.',
  steps: {
    idea: {
      title: 'Idea',
      description: 'Entendemos tu negocio y definimos el problema real antes de escribir una línea de código.',
    },
    design: {
      title: 'Diseño',
      description: 'UX/UI y arquitectura primero: prototipamos y decidimos antes de construir.',
    },
    build: {
      title: 'Construcción',
      description: 'Desarrollo iterativo con entregas frecuentes. Vas viendo el producto tomar forma.',
    },
    ship: {
      title: 'Producción',
      description: 'Deploy, medición y escala. Tu producto vivo y listo para crecer.',
    },
  },
},
```

- [ ] **Step 4: Add `en.process`**:

```ts
process: {
  eyebrow: '// process',
  title: 'From concept to reality, step by step',
  subtitle: 'A clear process: you know what happens at each stage and see progress often.',
  steps: {
    idea: {
      title: 'Idea',
      description: 'We understand your business and define the real problem before writing a line of code.',
    },
    design: {
      title: 'Design',
      description: 'UX/UI and architecture first: we prototype and decide before building.',
    },
    build: {
      title: 'Build',
      description: 'Iterative development with frequent releases. You watch the product take shape.',
    },
    ship: {
      title: 'Production',
      description: 'Deploy, measure, and scale. Your product live and ready to grow.',
    },
  },
},
```

- [ ] **Step 5: Run → GREEN + full suite.** Commit:

```bash
git add src/i18n/translations.ts src/i18n/process-i18n.test.ts
git commit -m "feat: add process journey i18n namespace"
```

---

### Task 2: StudioProcess component + scroll-driven connector

**Files:**
- Modify: `src/styles/global.css` (add the scroll-driven connector keyframe + guard)
- Create: `src/components/StudioProcess.tsx`
- Test: `src/components/StudioProcess.test.tsx`

**Interfaces:**
- Consumes: `useStore`, `useTranslations`, i18n `process.*`; `Section` + `Container`.
- Produces: default export `StudioProcess`, `<section id="process">`, 4 numbered steps with a vertical connector (static blueprint→ember gradient track + a scroll-driven ember fill) and per-step `reveal`.

**Scope note:** SKIP any visual-QA/design-skill step (deferred to the joint visual pass) — code + test + commit only.

- [ ] **Step 1: Add the connector CSS to `src/styles/global.css`** (after the existing `.reveal` block):

```css
/* Process connector — a scroll-driven fill that "draws" the journey concept→reality.
   Graceful: unsupported browsers show the full line; reduced-motion opts out. */
@keyframes process-fill {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}

.process-progress {
  transform-origin: top;
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .process-progress {
      transform: scaleY(0);
      animation: process-fill linear both;
      animation-timeline: view();
      animation-range: entry 30% exit 70%;
    }
  }
}
```

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioProcess from './StudioProcess';

describe('StudioProcess', () => {
  it('renders the four journey steps in the #process section', () => {
    render(<StudioProcess />);
    expect(document.getElementById('process')).not.toBeNull();
    for (const label of [/idea/i, /diseño|design/i, /construcción|build/i, /producción|production/i]) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    }
  });
  it('numbers the steps 01..04', () => {
    render(<StudioProcess />);
    for (const n of ['01', '02', '03', '04']) {
      expect(screen.getByText(n)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 3: Run → RED.**

- [ ] **Step 4: Implement `src/components/StudioProcess.tsx`**

```tsx
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

const STEPS = ['idea', 'design', 'build', 'ship'] as const;

export default function StudioProcess() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  return (
    <Section id="process" className="border-t border-ink-800">
      <Container>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300">{t('process.eyebrow')}</p>
        <h2 className="font-display text-4xl font-bold text-fg md:text-5xl">{t('process.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('process.subtitle')}</p>

        <div className="relative mt-16 pl-10">
          {/* Connector: static track (blueprint→ember) + scroll-driven fill */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-blueprint-400/30 to-ember-500/30" aria-hidden="true" />
          <div className="process-progress absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-blueprint-400 to-ember-500" aria-hidden="true" />

          <ol className="space-y-14">
            {STEPS.map((key, i) => (
              <li key={key} className="reveal relative">
                <span
                  className="absolute -left-10 top-1 flex h-4 w-4 items-center justify-center rounded-full border border-ink-700 bg-ink-950"
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-ember-500" />
                </span>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-sm text-fg-muted/60">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="font-display text-2xl font-semibold text-fg">{t(`process.steps.${key}.title`)}</h3>
                </div>
                <p className="mt-2 max-w-xl text-fg-muted">{t(`process.steps.${key}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 5: Run → GREEN + full suite.** Also run `npx tsc --noEmit` and confirm `StudioProcess.tsx` has no type error (only the pre-existing `vitest.config.ts` error is expected). Commit:

```bash
git add src/styles/global.css src/components/StudioProcess.tsx src/components/StudioProcess.test.tsx
git commit -m "feat: add StudioProcess journey with scroll-driven connector"
```

---

### Task 3: Mount StudioProcess at `#process`

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `StudioProcess`.
- Produces: the empty `#process` placeholder replaced by `<StudioProcess client:visible />` (renders its own `id="process"`). Nav's "Proceso" link now lands on the real section.

- [ ] **Step 1: Add the import** (with the other Studio imports):

```astro
import StudioProcess from '../components/StudioProcess.tsx';
```

- [ ] **Step 2: Replace the empty `#process` placeholder** in `<main>`:

Change `<section id="process" class="min-h-[40vh]"></section>` to:

```astro
		<StudioProcess client:visible />
```

`StudioProcess` renders `id="process"` — do NOT wrap it in another `<section id="process">`.

- [ ] **Step 3: Verify + commit**

Run: `rg "client:load" src/pages/index.astro` → no matches. `rg -c "id=\"process\"|StudioProcess" src/pages/index.astro`. `npm test` → all green.
```bash
git add src/pages/index.astro
git commit -m "feat: mount the process journey at #process"
```

---

## Self-Review

**Spec coverage (Phase D):**
- Process narrative "concept→reality, step by step" (4 numbered steps) → Tasks 1, 2. ✅
- Scroll-driven connector (blueprint→ember), graceful + reduced-motion → Task 2. ✅
- Mount + nav anchor resolves → Task 3. ✅
- Deferred correctly: elaborate cinematic tuning (sketch→polished morph, per-step affordances) → joint visual pass.

**Placeholder scan:** none — copy, tokens, and the CSS are concrete.

**Type/consistency:** `process.*` i18n keys (Task 1) consumed by Task 2; `StudioProcess` default export (Task 2) mounted in Task 3; numbered markers derived from index (01–04); connector classes (`process-progress`, `reveal`) defined in global.css.

## Open items carried to the joint visual pass
- Tune the scroll-driven connector timing + the per-step reveal choreography with the design skills, live.
- Optional: per-step "sketch→rendered" visual affordance (the fuller cinematic version).
- Verify the section on mobile + reduced-motion + Safari (scroll-timeline support varies → graceful static fallback).
