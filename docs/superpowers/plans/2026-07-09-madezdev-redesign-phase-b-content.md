# madezdev Redesign — Phase B: Content Sections — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the Phase-A shell with content: outcome-framed Services (4 pillars), a data-driven Cases section (the proof engine), a Trust section (client logos + testimonials), and a restyled Contact section that reuses the existing nodemailer API.

**Architecture:** Continue the studio design system (ink + ember, `@theme` tokens, Motion, selective islands). Services becomes 4 outcome pillars. Cases is driven by a typed `src/data/cases.ts` module so it works with 0..N real cases; owner fills real content later. Trust derives its logos + testimonials from the same cases data (no duplicate source of truth). Contact reuses the existing `POST /api/contact` (`{name,email,subject,budget?,message,language}`) with studio copy, subjects mapped to the 4 pillars, and the budget field dropped.

**Tech Stack:** Astro 5 SSR, React 19, Tailwind 4 `@theme`, Motion, nanostores i18n, Vitest + @testing-library/react, existing nodemailer `/api/contact`.

## Global Constraints

- Artifacts (code/identifiers/comments) in English. **UI copy is Spanish-first (ES) + English**, in `src/i18n/translations.ts`.
- Studio "we" identity (nosotros); never freelancer singular.
- Signature accent ember/orange (`ember-*`); ink base; NO blue→purple, NO emoji-as-icons.
- Every animation honors `prefers-reduced-motion`; content renders SSR-safe (not gated behind motion). Islands hydrate `client:visible`.
- Reuse `POST /api/contact` unchanged. Request body: `{ name, email, subject, budget?, message, language: 'es'|'en' }`. Responses: `200 {success:true}`, `400`/`500 {success:false, message}`.
- Cases data has NO metrics (owner has screenshots, live links, client logos, testimonials — not numbers). Do not invent metrics.
- **Visual polish is DEFERRED** to a joint human pass (as in Phase A): implementer subagents do code + TDD + commit and SKIP any "visual QA / design-skill" step. Do NOT run a long-lived `npm run dev`. Verify via `vitest`.
- Do NOT run `astro build`. Conventional commits, no AI attribution.
- Tailwind 4 CSS-first: use the existing `@theme` tokens (`ink-*`, `ember-*`, `blueprint-*`, `fg`, `fg-muted`, `font-display/mono`). Do NOT use dynamically-interpolated color classNames (e.g. `bg-${color}-500`) — Tailwind 4 JIT will not generate them; use static classes.

---

### Task 1: Services i18n — replace the 6 tech items with 4 outcome pillars

**Files:**
- Modify: `src/i18n/translations.ts` (replace the `services` namespace in BOTH `es` and `en`)
- Test: `src/i18n/services-i18n.test.ts`

**Interfaces:**
- Produces: `services` namespace shape `{ title, subtitle, pillars: { web|product|automation|ai: { title, description, outcomes: {0,1,2} } } }` in both languages (symmetric). Consumed by Task 4.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { translations } from './translations';
import { t } from './utils';

describe('services pillars i18n', () => {
  it('has exactly the four outcome pillars in both languages', () => {
    const pillars = ['web', 'product', 'automation', 'ai'];
    expect(Object.keys(translations.es.services.pillars).sort()).toEqual([...pillars].sort());
    expect(Object.keys(translations.en.services.pillars).sort()).toEqual([...pillars].sort());
  });
  it('is outcome-framed, studio voice', () => {
    expect(t('services.pillars.ai.title', 'es')).toBe('IA aplicada');
    expect(t('services.pillars.product.title', 'en')).toBe('Products & custom SaaS');
  });
});
```

- [ ] **Step 2: Run test → RED**

Run: `npx vitest run src/i18n/services-i18n.test.ts`
Expected: FAIL — `translations.es.services.pillars` is undefined (old shape has `items`).

- [ ] **Step 3: Replace the `es.services` namespace**

```ts
services: {
  title: 'Lo que construimos',
  subtitle: 'Diseñamos y desarrollamos el producto completo — de la idea a producción — y lo dejamos listo para crecer.',
  pillars: {
    web: {
      title: 'Webs y sitios que venden',
      description: 'Sitios y landing pages rápidos, medibles y hechos para convertir, no solo para verse bien.',
      outcomes: { 0: 'Diseño a medida', 1: 'Performance y SEO', 2: 'Listos para escalar' },
    },
    product: {
      title: 'Productos y SaaS a medida',
      description: 'Del concepto al producto en producción: arquitectura sólida, pagos, paneles y multi-tenant.',
      outcomes: { 0: 'MVP a producción', 1: 'Suscripciones y pagos', 2: 'Arquitectura escalable' },
    },
    automation: {
      title: 'Automatizaciones',
      description: 'Conectamos tus herramientas y eliminamos el trabajo manual repetitivo que te frena.',
      outcomes: { 0: 'Integraciones a medida', 1: 'Flujos automáticos', 2: 'Menos errores, más tiempo' },
    },
    ai: {
      title: 'IA aplicada',
      description: 'Asistentes, agentes y features con IA que mueven de verdad el negocio, no demos de laboratorio.',
      outcomes: { 0: 'Asistentes y agentes', 1: 'Automatización con IA', 2: 'Integración de modelos' },
    },
  },
},
```

- [ ] **Step 4: Replace the `en.services` namespace**

```ts
services: {
  title: 'What we build',
  subtitle: 'We design and build the whole product — from idea to production — and leave it ready to grow.',
  pillars: {
    web: {
      title: 'Websites that sell',
      description: 'Fast, measurable sites and landing pages built to convert, not just to look good.',
      outcomes: { 0: 'Custom design', 1: 'Performance & SEO', 2: 'Ready to scale' },
    },
    product: {
      title: 'Products & custom SaaS',
      description: 'From concept to production: solid architecture, payments, dashboards, and multi-tenant.',
      outcomes: { 0: 'MVP to production', 1: 'Subscriptions & payments', 2: 'Scalable architecture' },
    },
    automation: {
      title: 'Automations',
      description: 'We connect your tools and remove the repetitive manual work that slows you down.',
      outcomes: { 0: 'Custom integrations', 1: 'Automated workflows', 2: 'Fewer errors, more time' },
    },
    ai: {
      title: 'Applied AI',
      description: 'Assistants, agents, and AI features that actually move the business — not lab demos.',
      outcomes: { 0: 'Assistants & agents', 1: 'AI automation', 2: 'Model integration' },
    },
  },
},
```

- [ ] **Step 5: Run test → GREEN, then full suite**

Run: `npx vitest run src/i18n/services-i18n.test.ts` → PASS, then `npm test` → all pass.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/translations.ts src/i18n/services-i18n.test.ts
git commit -m "feat: reframe services i18n into four outcome pillars"
```

---

### Task 2: Cases + Trust i18n

**Files:**
- Modify: `src/i18n/translations.ts` (add `cases` and `trust` namespaces to both languages)
- Test: `src/i18n/cases-trust-i18n.test.ts`

**Interfaces:**
- Produces: `cases: { title, subtitle, liveLabel, emptyLabel }` and `trust: { title, subtitle }` in both languages. Consumed by Tasks 5, 6.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { translations } from './translations';

describe('cases + trust i18n', () => {
  it('defines cases and trust in both languages', () => {
    for (const lang of ['es', 'en'] as const) {
      expect(translations[lang].cases.title).toBeTruthy();
      expect(translations[lang].cases.liveLabel).toBeTruthy();
      expect(translations[lang].trust.title).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run → RED**

Run: `npx vitest run src/i18n/cases-trust-i18n.test.ts` — FAIL (`cases` undefined).

- [ ] **Step 3: Add to `es`**

```ts
cases: {
  title: 'Del concepto a la realidad',
  subtitle: 'Algunos productos que llevamos de la idea a producción.',
  liveLabel: 'Ver en vivo',
  emptyLabel: 'Casos en camino.',
},
trust: {
  title: 'Confían en nosotros',
  subtitle: 'Marcas y equipos que ya construyeron con madezdev.',
},
```

- [ ] **Step 4: Add to `en`**

```ts
cases: {
  title: 'From concept to reality',
  subtitle: 'A few products we took from idea to production.',
  liveLabel: 'View live',
  emptyLabel: 'Case studies coming soon.',
},
trust: {
  title: 'Trusted by',
  subtitle: 'Brands and teams that already built with madezdev.',
},
```

- [ ] **Step 5: Run → GREEN + full suite.** Then commit:

```bash
git add src/i18n/translations.ts src/i18n/cases-trust-i18n.test.ts
git commit -m "feat: add cases and trust i18n namespaces"
```

---

### Task 3: Cases data module (`src/data/cases.ts`)

**Files:**
- Create: `src/data/cases.ts`
- Test: `src/data/cases.test.ts`

**Interfaces:**
- Produces:
  - `type Case = { id: string; client: string; title: string; category: 'web'|'product'|'automation'|'ai'; summary: string; image: string; liveUrl?: string; logo?: string; testimonial?: { quote: string; author: string; role: string } }`
  - `const cases: Case[]` — seeded with 2 clearly-marked PLACEHOLDER entries (owner replaces).
  - `function getTestimonials(): Array<{ quote:string; author:string; role:string; client:string }>` — testimonials pulled from cases that have one.
  - `function getClientLogos(): Array<{ client: string; logo: string }>` — from cases that have a `logo`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { cases, getTestimonials, getClientLogos, type Case } from './cases';

describe('cases data module', () => {
  it('every case has the required fields and a valid category', () => {
    const cats = ['web', 'product', 'automation', 'ai'];
    for (const c of cases) {
      expect(c.id && c.client && c.title && c.summary && c.image).toBeTruthy();
      expect(cats).toContain(c.category);
    }
  });
  it('derives testimonials only from cases that have them', () => {
    const withT = cases.filter((c) => c.testimonial).length;
    expect(getTestimonials()).toHaveLength(withT);
  });
  it('derives client logos only from cases that have a logo', () => {
    const withLogo = cases.filter((c) => c.logo).length;
    expect(getClientLogos()).toHaveLength(withLogo);
  });
});
```

- [ ] **Step 2: Run → RED.** `npx vitest run src/data/cases.test.ts`

- [ ] **Step 3: Implement `src/data/cases.ts`**

```ts
export type Case = {
  id: string;
  client: string;
  title: string;
  category: 'web' | 'product' | 'automation' | 'ai';
  summary: string;
  image: string;
  liveUrl?: string;
  logo?: string;
  testimonial?: { quote: string; author: string; role: string };
};

// PLACEHOLDER DATA — replace with real case studies (owner has screenshots,
// live links, client logos, and testimonials; no metrics). Keep the shape.
export const cases: Case[] = [
  {
    id: 'placeholder-1',
    client: 'Cliente ejemplo',
    title: 'Plataforma SaaS de gestión',
    category: 'product',
    summary:
      'Placeholder — reemplazar. Qué construimos y qué resolvió para el cliente, en 1–2 frases.',
    image: '/cases/placeholder-1.png',
    liveUrl: 'https://example.com',
    logo: '/cases/logos/placeholder-1.svg',
    testimonial: {
      quote: 'Placeholder — cita real del cliente sobre trabajar con madezdev.',
      author: 'Nombre Apellido',
      role: 'CEO, Cliente ejemplo',
    },
  },
  {
    id: 'placeholder-2',
    client: 'Cliente ejemplo 2',
    title: 'Sitio de alto rendimiento',
    category: 'web',
    summary: 'Placeholder — reemplazar con el segundo caso real.',
    image: '/cases/placeholder-2.png',
    liveUrl: 'https://example.com',
  },
];

export function getTestimonials() {
  return cases
    .filter((c): c is Case & { testimonial: NonNullable<Case['testimonial']> } => Boolean(c.testimonial))
    .map((c) => ({ ...c.testimonial, client: c.client }));
}

export function getClientLogos() {
  return cases
    .filter((c): c is Case & { logo: string } => Boolean(c.logo))
    .map((c) => ({ client: c.client, logo: c.logo }));
}
```

- [ ] **Step 4: Run → GREEN + full suite.** Commit:

```bash
git add src/data/cases.ts src/data/cases.test.ts
git commit -m "feat: add data-driven cases module with placeholders and derived selectors"
```

---

### Task 4: StudioServices component (4 pillars) — code only

**Files:**
- Create: `src/components/StudioServices.tsx`
- Test: `src/components/StudioServices.test.tsx`

**Interfaces:**
- Consumes: `useStore(currentLanguage)`, `useTranslations`, i18n `services.title|subtitle|pillars.*`; `Section` + `Container` primitives.
- Produces: default export `StudioServices`, renders a `<section id="services">` with 4 pillar cards. Content renders SSR-safe (no motion gating).

**Scope note:** SKIP any visual-QA/design-skill step — code + test + commit only.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioServices from './StudioServices';

describe('StudioServices', () => {
  it('renders the four outcome pillars', () => {
    render(<StudioServices />);
    expect(screen.getByText(/IA aplicada|Applied AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Productos y SaaS|Products & custom SaaS/i)).toBeInTheDocument();
    expect(screen.getByText(/Automatizaciones|Automations/i)).toBeInTheDocument();
    const section = screen.getByText(/IA aplicada|Applied AI/i).closest('section');
    expect(section).toHaveAttribute('id', 'services');
  });
});
```

- [ ] **Step 2: Run → RED.**

- [ ] **Step 3: Implement `StudioServices.tsx`**

```tsx
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

const PILLARS = ['web', 'product', 'automation', 'ai'] as const;

export default function StudioServices() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  return (
    <Section id="services">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-4">
          // servicios
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-fg">{t('services.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('services.subtitle')}</p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {PILLARS.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-ink-800 bg-ink-900/60 p-8 transition-colors hover:border-ember-500/50"
            >
              <h3 className="font-display text-2xl font-semibold text-fg">
                {t(`services.pillars.${key}.title`)}
              </h3>
              <p className="mt-3 text-fg-muted">{t(`services.pillars.${key}.description`)}</p>
              <ul className="mt-6 space-y-2">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center text-sm text-fg-muted">
                    <span className="mr-2 text-ember-500" aria-hidden="true">→</span>
                    {t(`services.pillars.${key}.outcomes.${i}`)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 4: Run → GREEN + full suite.** Commit:

```bash
git add src/components/StudioServices.tsx src/components/StudioServices.test.tsx
git commit -m "feat: add StudioServices four-pillar section"
```

---

### Task 5: StudioCases component (data-driven) — code only

**Files:**
- Create: `src/components/StudioCases.tsx`
- Test: `src/components/StudioCases.test.tsx`

**Interfaces:**
- Consumes: `useStore`, `useTranslations`, i18n `cases.title|subtitle|liveLabel|emptyLabel`; `cases` from `../data/cases`; `Section` + `Container`.
- Produces: default export `StudioCases`, `<section id="cases">`. Renders a card per case (image, client, title, summary, live link when present, testimonial when present). If `cases` is empty, renders `cases.emptyLabel`.

**Scope note:** SKIP visual-QA/design-skill — code + test + commit only.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioCases from './StudioCases';
import { cases } from '../data/cases';

describe('StudioCases', () => {
  it('renders a card for every case with an accessible image and title', () => {
    render(<StudioCases />);
    const section = document.getElementById('cases');
    expect(section).not.toBeNull();
    // one img per case (alt = client or title)
    expect(screen.getAllByRole('img').length).toBe(cases.length);
    // each case title appears
    for (const c of cases) expect(screen.getByText(c.title)).toBeInTheDocument();
  });
  it('renders a live link only for cases that have a liveUrl', () => {
    render(<StudioCases />);
    const withLive = cases.filter((c) => c.liveUrl).length;
    expect(screen.getAllByRole('link', { name: /ver en vivo|view live/i })).toHaveLength(withLive);
  });
});
```

- [ ] **Step 2: Run → RED.**

- [ ] **Step 3: Implement `StudioCases.tsx`**

```tsx
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { cases } from '../data/cases';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

export default function StudioCases() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  return (
    <Section id="cases" className="bg-ink-900/40">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-4">// casos</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-fg">{t('cases.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('cases.subtitle')}</p>

        {cases.length === 0 ? (
          <p className="mt-14 text-fg-muted">{t('cases.emptyLabel')}</p>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {cases.map((c) => (
              <article key={c.id} className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-950">
                <img src={c.image} alt={c.client || c.title} className="aspect-[16/10] w-full object-cover" />
                <div className="p-6">
                  <p className="font-mono text-xs uppercase tracking-widest text-ember-400">{c.client}</p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-fg">{c.title}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{c.summary}</p>
                  {c.testimonial && (
                    <blockquote className="mt-4 border-l-2 border-ember-500 pl-4 text-sm italic text-fg-muted">
                      “{c.testimonial.quote}”
                      <footer className="mt-1 not-italic text-xs text-fg-muted/80">
                        — {c.testimonial.author}, {c.testimonial.role}
                      </footer>
                    </blockquote>
                  )}
                  {c.liveUrl && (
                    <a
                      href={c.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ember-500 hover:text-ember-400"
                    >
                      {t('cases.liveLabel')} <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
```

- [ ] **Step 4: Run → GREEN + full suite.** Commit:

```bash
git add src/components/StudioCases.tsx src/components/StudioCases.test.tsx
git commit -m "feat: add data-driven StudioCases section"
```

---

### Task 6: StudioTrust component (logos + testimonials) — code only

**Files:**
- Create: `src/components/StudioTrust.tsx`
- Test: `src/components/StudioTrust.test.tsx`

**Interfaces:**
- Consumes: `useStore`, `useTranslations`, i18n `trust.title|subtitle`; `getClientLogos` + `getTestimonials` from `../data/cases`; `Section` + `Container`.
- Produces: default export `StudioTrust`, `<section id="trust">`. Renders logos row + testimonials. If BOTH derived lists are empty, renders `null` (section absent) so we never show an empty trust band.

**Scope note:** SKIP visual-QA/design-skill — code + test + commit only.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioTrust from './StudioTrust';
import { getClientLogos, getTestimonials } from '../data/cases';

describe('StudioTrust', () => {
  it('renders the trust section when there is logo/testimonial data', () => {
    render(<StudioTrust />);
    const hasData = getClientLogos().length > 0 || getTestimonials().length > 0;
    if (hasData) {
      expect(screen.getByText(/confían en nosotros|trusted by/i)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(/confían en nosotros|trusted by/i)).toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run → RED.**

- [ ] **Step 3: Implement `StudioTrust.tsx`**

```tsx
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { getClientLogos, getTestimonials } from '../data/cases';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

export default function StudioTrust() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const logos = getClientLogos();
  const testimonials = getTestimonials();

  if (logos.length === 0 && testimonials.length === 0) return null;

  return (
    <Section id="trust">
      <Container>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-fg">{t('trust.title')}</h2>
        <p className="mt-3 max-w-2xl text-fg-muted">{t('trust.subtitle')}</p>

        {logos.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-10 opacity-80">
            {logos.map((l) => (
              <img key={l.client} src={l.logo} alt={l.client} className="h-8 w-auto grayscale" />
            ))}
          </div>
        )}

        {testimonials.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {testimonials.map((tm) => (
              <blockquote key={tm.client} className="rounded-2xl border border-ink-800 bg-ink-900/60 p-6">
                <p className="text-fg">“{tm.quote}”</p>
                <footer className="mt-3 text-sm text-fg-muted">— {tm.author}, {tm.role}</footer>
              </blockquote>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
```

- [ ] **Step 4: Run → GREEN + full suite.** Commit:

```bash
git add src/components/StudioTrust.tsx src/components/StudioTrust.test.tsx
git commit -m "feat: add StudioTrust logos and testimonials section"
```

---

### Task 7: StudioContact — reuse /api/contact with studio copy + i18n (contact namespace reframe)

**Files:**
- Modify: `src/i18n/translations.ts` (reframe the `contact` namespace in both languages)
- Create: `src/components/StudioContact.tsx`
- Test: `src/components/StudioContact.test.tsx`

**Interfaces:**
- Consumes: `useStore`, `useTranslations`; posts to `POST /api/contact` with `{ name, email, subject, message, language }` (budget omitted — API treats it as optional). Subjects map to the 4 pillars + `other`.
- Produces: default export `StudioContact`, `<section id="contact">`. New i18n keys under `contact`: `title, subtitle, form.{name,namePlaceholder,email,emailPlaceholder,subject,subjectPlaceholder,message,messagePlaceholder,submit,sending,success,error}`, and `contact.subjects.{web,product,automation,ai,other}`.

**Scope note:** SKIP visual-QA/design-skill — code + test + commit only.

**Decisions baked in:** the freelancer budget `<select>` is DROPPED (studio doesn't lead with price; AI front door in Phase C qualifies scope). The old hardcoded error string becomes the i18n key `contact.form.error`.

- [ ] **Step 1: Reframe the `contact` namespace (es)** — replace the existing `es.contact`:

```ts
contact: {
  title: 'Contanos tu proyecto',
  subtitle: 'Contanos qué tenés en mente y te respondemos con los próximos pasos. Normalmente en 24 h.',
  subjects: {
    web: 'Web o sitio',
    product: 'Producto / SaaS',
    automation: 'Automatización',
    ai: 'IA aplicada',
    other: 'Otro',
  },
  form: {
    name: 'Nombre',
    namePlaceholder: 'Tu nombre',
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    subject: '¿Qué necesitás?',
    subjectPlaceholder: 'Elegí una opción',
    message: 'Mensaje',
    messagePlaceholder: 'Contanos sobre tu proyecto...',
    submit: 'Enviar',
    sending: 'Enviando...',
    success: '¡Mensaje enviado! Te respondemos pronto.',
    error: 'No se pudo enviar. Probá de nuevo en un momento.',
  },
},
```

- [ ] **Step 2: Reframe the `contact` namespace (en)** — replace the existing `en.contact`:

```ts
contact: {
  title: 'Tell us about your project',
  subtitle: 'Tell us what you have in mind and we’ll reply with the next steps. Usually within 24h.',
  subjects: {
    web: 'Website',
    product: 'Product / SaaS',
    automation: 'Automation',
    ai: 'Applied AI',
    other: 'Other',
  },
  form: {
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    subject: 'What do you need?',
    subjectPlaceholder: 'Pick one',
    message: 'Message',
    messagePlaceholder: 'Tell us about your project...',
    submit: 'Send',
    sending: 'Sending...',
    success: 'Message sent! We’ll get back to you soon.',
    error: 'Could not send. Please try again in a moment.',
  },
},
```

- [ ] **Step 3: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudioContact from './StudioContact';

describe('StudioContact', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) })) as any);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders in the #contact section with name, email, subject, message and no budget field', () => {
    render(<StudioContact />);
    expect(document.getElementById('contact')).not.toBeNull();
    expect(screen.getByLabelText(/nombre|name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mensaje|message/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/presupuesto|budget/i)).toBeNull();
  });

  it('posts to /api/contact with name/email/subject/message/language and shows success', async () => {
    render(<StudioContact />);
    fireEvent.change(screen.getByLabelText(/nombre|name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ada@x.com' } });
    fireEvent.change(screen.getByLabelText(/mensaje|message/i), { target: { value: 'Hola' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar|send/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' })));
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ name: 'Ada', email: 'ada@x.com', message: 'Hola' });
    expect(body).toHaveProperty('language');
    expect(body).not.toHaveProperty('budget');
    await waitFor(() => expect(screen.getByText(/mensaje enviado|message sent/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 4: Run → RED.**

- [ ] **Step 5: Implement `StudioContact.tsx`**

```tsx
import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

const SUBJECTS = ['web', 'product', 'automation', 'ai', 'other'] as const;

export default function StudioContact() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      subject: String(data.get('subject') ?? ''),
      message: String(data.get('message') ?? ''),
      language: lang,
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) throw new Error('failed');
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  const field = 'w-full rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 text-fg placeholder-fg-muted/60 focus:border-ember-500 focus:outline-none';

  return (
    <Section id="contact">
      <Container className="max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-4">// contacto</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-fg">{t('contact.title')}</h2>
        <p className="mt-4 text-lg text-fg-muted">{t('contact.subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-fg-muted">{t('contact.form.name')}</label>
            <input id="name" name="name" type="text" required className={field} placeholder={t('contact.form.namePlaceholder')} />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-fg-muted">{t('contact.form.email')}</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={field} placeholder={t('contact.form.emailPlaceholder')} />
          </div>
          <div>
            <label htmlFor="subject" className="mb-2 block text-sm text-fg-muted">{t('contact.form.subject')}</label>
            <select id="subject" name="subject" required defaultValue="" className={field}>
              <option value="" disabled>{t('contact.form.subjectPlaceholder')}</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{t(`contact.subjects.${s}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm text-fg-muted">{t('contact.form.message')}</label>
            <textarea id="message" name="message" rows={5} required className={`${field} resize-none`} placeholder={t('contact.form.messagePlaceholder')} />
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full rounded-full bg-ember-500 px-6 py-4 font-semibold text-ink-950 hover:bg-ember-400 disabled:opacity-60"
          >
            {status === 'sending' ? t('contact.form.sending') : t('contact.form.submit')}
          </button>
          {status === 'success' && <p className="text-sm text-ember-400">{t('contact.form.success')}</p>}
          {status === 'error' && <p className="text-sm text-red-400">{t('contact.form.error')}</p>}
        </form>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 6: Run → GREEN + full suite.** Commit:

```bash
git add src/i18n/translations.ts src/components/StudioContact.tsx src/components/StudioContact.test.tsx
git commit -m "feat: add StudioContact reusing /api/contact with studio copy"
```

---

### Task 8: Rewire index.astro — mount the content sections

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `StudioServices`, `StudioCases`, `StudioTrust`, `StudioContact`.
- Produces: `#services`, `#cases`, `#contact` filled with real components; a new `#trust` section added between cases and contact; `#ai` and `#process` remain empty placeholders (Phases C/D).

- [ ] **Step 1: Update the imports** in the frontmatter of `src/pages/index.astro` (add after the existing Studio imports):

```astro
import StudioServices from '../components/StudioServices.tsx';
import StudioCases from '../components/StudioCases.tsx';
import StudioTrust from '../components/StudioTrust.tsx';
import StudioContact from '../components/StudioContact.tsx';
```

- [ ] **Step 2: Replace the placeholder `<main>` body** so services/cases/trust/contact mount and #ai/#process stay as placeholders:

```astro
	<main>
		<StudioHero client:visible />
		<section id="ai" class="min-h-[40vh]"></section>
		<StudioServices client:visible />
		<section id="process" class="min-h-[40vh]"></section>
		<StudioCases client:visible />
		<StudioTrust client:visible />
		<StudioContact client:visible />
	</main>
```

Note: `StudioServices` renders `id="services"`, `StudioCases` renders `id="cases"`, `StudioContact` renders `id="contact"` — so the nav/hero anchors resolve to the real sections now. `StudioTrust` renders `id="trust"` (or nothing if no data).

- [ ] **Step 3: Verify** by reading the file back: 4 new imports present; the empty `#services`/`#cases`/`#contact` placeholder sections are gone (now real components); `#ai` and `#process` remain; no `client:load`. Run `npm test` (all green — no test renders index.astro).

Run: `rg "client:load" src/pages/index.astro` → no matches.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: mount Phase B content sections in the landing page"
```

---

## Self-Review

**Spec coverage (Phase B):**
- Services outcome-framed (4 pillars) → Tasks 1, 4. ✅
- Cases as data-driven proof engine (screenshots/live links/logos/testimonials, NO metrics) → Tasks 2, 3, 5. ✅
- Trust (logos + testimonials, derived, hidden when empty) → Tasks 2, 3, 6. ✅
- Contact reuses `/api/contact` unchanged, studio copy, subjects=pillars, budget dropped, i18n error key → Task 7. ✅
- Wiring + anchors resolve → Task 8. ✅
- Deferred correctly OUT of Phase B: AI front door (#ai, Phase C), Process narrative (#process, Phase D), visual polish (joint pass).

**Placeholder scan:** the ONLY intentional placeholders are the seed entries in `src/data/cases.ts`, explicitly commented as owner-replace and structurally valid so the section renders. All code, i18n copy, and paths are concrete.

**Type consistency:** `Case` type + `cases`/`getTestimonials`/`getClientLogos` (Task 3) consumed by Tasks 5/6; i18n keys defined in Tasks 1/2/7 match those consumed in Tasks 4/5/6/7; component default-export names (`StudioServices`, `StudioCases`, `StudioTrust`, `StudioContact`) match the imports in Task 8; the `/api/contact` payload matches the verified API contract (`name,email,subject,message,language`; budget optional/omitted).

## Open items carried to build / visual pass
- Replace `src/data/cases.ts` placeholders with real case studies + drop screenshots/logos into `public/cases/`.
- Visual polish (spacing, motion reveals on scroll, card treatments) for all four sections in the joint visual pass.
- Contact: consider client-side email format validation in the visual/UX pass (API only checks presence).
