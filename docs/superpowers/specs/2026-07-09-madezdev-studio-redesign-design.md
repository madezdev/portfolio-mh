# madezdev — Studio Site Redesign (Design Spec)

- **Date:** 2026-07-09
- **Status:** Approved (brainstorming) — pending user review before implementation planning
- **Owner:** Martin Hernandez
- **Repo:** portfolio-mh (Astro 5 SSR + React 19 + TailwindCSS 4, deployed on Vercel)

> Note on language: This spec is written in English (neutral, professional). Spanish
> strings appear only as **example UI copy**, because the site ships Spanish-first
> (ES default) with an English translation. Final copy is refined during build.

---

## 1. Context & Problem

The current site is a **solo-freelancer portfolio**: first-person "Martin, Full Stack
Developer & UX/UI Designer," with a `TeamWork` section that literally apologizes for
being small ("big project? don't worry, I have a team"). It has **no real work shown**,
skill bars with invented percentages, invented stats, a dead `CookieConsent` component,
placeholder social handles, and a template-default blue→purple gradient on a `slate-950`
base. Every component hydrates eagerly with `client:load`.

The goal is a **repositioning to a studio** that offers web builds, custom products/SaaS,
automations, and applied AI — a site with a life of its own: unique, engaging, and that
adds real value to the visitor. The existing LinkedIn brand already resolves the identity:
**madezdev — "Del concepto a la realidad."**

## 2. Goals & Non-Goals

**Goals**
- Reposition from freelancer to **studio ("we")**, consistent with the madezdev brand.
- Build the site **around real proof** (case studies) as the core credibility engine.
- Make the site *embody* the tagline "del concepto a la realidad" instead of just stating it.
- Introduce an **AI front door**: a conversational assistant that helps the visitor start
  defining their project (orient → qualify → hand off), which also *demonstrates* the studio's
  AI capability.
- Deliver a distinctive, non-templated visual + motion identity.

**Non-Goals (v1)**
- No AI-generated project briefs or price/timeline estimates (deliberately scoped out — future).
- No real booking integration (Cal.com/Calendly) in v1 — derive via email; booking is a future add.
- No localized URL routes (`/es`, `/en`) — keep the existing client-side i18n; URL routing is a
  future SEO enhancement.
- No blog / content system in v1.
- No framework migration — stay on Astro + React + Tailwind + Vercel.

## 3. Strategic Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| **Identity** | Studio madezdev — copy in first-person plural ("we"). Martin may appear as founder/lead, but the brand is the team. |
| **Proof** | Real projects/clients exist → site is built around **results / case studies**. |
| **Positioning** | Full-cycle studio ("del concepto a la realidad"); services as parallel pillars. |
| **Primary conversion** | An **AI conversational front door** where the visitor starts defining their project. |
| **AI scope (v1)** | Converse + qualify + hand off. Controllable and on-rails. No estimates. |
| **Creative direction** | **Hybrid: "concept → reality" scroll narrative (backbone) + the AI elevated** as a prominent, dedicated moment and recurring CTA. Not a chat-as-hero. |
| **Accent color** | **Signature orange/amber** (ties to the existing logo/LinkedIn mark; ownable vs. the ubiquitous dev blue→purple). |
| **Motion library** | **Motion** (Framer Motion successor, tree-shakeable) for island micro-interactions + **CSS scroll-driven animations** for the Process section. GSAP held in reserve only if the Process sequence becomes very complex. |

**Creative through-line:** the site is a descent from the **concept** (abstract, cool,
blueprint-like) to **reality** (warm, orange, real case studies). The AI is the mechanism
that turns a visitor's concept into the first step toward a real project — *the medium is
the message*.

## 4. Site Architecture & Narrative Flow

Top → bottom, each section is a step in the concept → reality journey:

| # | Section | Role in the journey | What it does |
|---|---|---|---|
| 0 | **Nav** | — | `madezdev` · Servicios · Casos · Proceso · ES/EN · CTA "Agendá una llamada". Sticky; solidifies on scroll. |
| 1 | **Hero — "El concepto"** | The spark (abstract) | SSR static, fast, indexable. Statement: **"Del concepto a la realidad."** + outcome subhead ("Diseñamos y construimos productos, SaaS y automatizaciones con IA — de la idea a producción"). CTAs: *Definí tu proyecto* (to the AI) + *Ver casos*. Nascent/blueprint aesthetic, kinetic type on "realidad". |
| 2 | **AI — "Definamos tu idea"** | The bridge | **Elevated, dedicated AI moment** right under the hero. Conversational input + example chips. Orients, qualifies, hands off to email/call. |
| 3 | **Servicios — pillars** | The *how* | Reframed by **business outcome**, not tech: Web & Sitios · Productos & SaaS a medida · Automatizaciones · IA aplicada. No emoji-as-icons. |
| 4 | **Proceso — "El recorrido"** | The transformation | **Narrative centerpiece.** Scroll-driven: Idea → Diseño → Construcción → Producción. Visual "renders" from rough sketch to polished product. Replaces the apologetic `TeamWork` section. |
| 5 | **Casos — "La realidad"** | The payoff | Real case studies, outcome-first: what we built + result/metric. The heart of the site; the journey's destination. |
| 6 | **Confianza** | Validation | Testimonials / client logos / metrics-with-context (subject to available assets). |
| 7 | **CTA final + contacto** | The action | "¿Tu idea ya es concepto? Hagámosla realidad." Primary: AI / agendá. Secondary: contact form (reuses existing nodemailer). |
| 8 | **Footer** | — | madezdev identity, real links, real copyright year. |

**Kill list:** apologetic `TeamWork`; invented skill % bars; invented stats (6+/50+);
dead `CookieConsent` (wire it properly or remove); placeholder social handles (`martin-dev`);
"© 2024".

**Reuse list:** i18n system (nanostores + `translations.ts`); contact API (nodemailer) as
the secondary path and the AI hand-off sink; Vercel deploy; evolved dark theme base.

## 5. The AI Front Door ("Definamos tu idea") — v1

**Behavior (the script):**
1. Visitor sees an invitation + example chips ("Quiero un SaaS", "Automatizar un proceso",
   "Rehacer mi web").
2. They type their idea. The AI replies in **streaming** and asks 2–4 smart qualifying
   questions (what, for whom, stage, timeline). It stays **on-rails** as a madezdev intake
   assistant — not a general chatbot.
3. Once it has enough signal, it **summarizes what it understood** and hands off: it captures
   **name + email** and fires the lead.

**Guardrails (must be controllable):**
- Tightly scoped system prompt: intake topics only; refuses off-topic; **no price commitments**;
  replies in the visitor's language (ES/EN).
- **Turn cap + token budget** per conversation to control cost.
- **Rate limiting** per IP/session (the current contact API has none — an unthrottled LLM
  endpoint is a cost hole). Non-negotiable.

**Tech:**
- **Vercel AI SDK v6 + AI Gateway** using a `"provider/model"` string (no lock-in to a
  provider package). A small, fast model for intake — cheap and sufficient.
- Astro API route `src/pages/api/chat.ts` using `streamText`, on **Fluid Compute** (Node.js),
  streaming response.
- Frontend: a **React island** (`client:visible`) with the chat UI using the SDK's streaming
  hook. Does not hydrate until visible.
- **Lead capture is UI-driven** for v1 (a mini name+email form appears after N turns or via a
  "listo, contáctenme" button), not tool-calling — more predictable. Tool-calling capture is a
  v2 upgrade.

**Data flow:**
```
user → island → POST /api/chat (stream) → AI SDK → Gateway → model → tokens live
  on hand-off → capture name+email → POST /api/contact (existing nodemailer)
     → owner email with conversation summary (qualified lead) + auto-reply to visitor
```
The AI **feeds** the existing contact backend with qualified leads; it does not replace it.

**Error handling / fallback:**
- If the chat API or model fails → the panel **degrades gracefully** to the normal contact
  form + "Agendá una llamada" CTA. The visitor never hits a dead end.
- No-JS / SSR: the panel renders a static invitation + CTA, so it works and indexes before
  hydration.

**Rate limiting implementation:** in-memory is unreliable across Fluid instances → use
**Upstash Redis** (Vercel Marketplace, cents) keyed by IP/session, with an in-route turn cap
as the minimum baseline.

## 6. Visual System

**Diagnosis:** the current `slate-950` + blue→purple gradient is the template-default of
dev portfolios and reads as "generated." It must go.

**Palette (with rationale, not taste):**
- **Base:** a deeper, more premium ink-black (not the bluish generic slate-950).
- **Signature accent:** **electric orange/amber.** Rationale: it is *already the brand*
  (the logo's `</>` and the LinkedIn banner tagline are orange), and almost no dev studio
  uses it (they all pick blue) → **ownable** and differentiating. Orange = energy, warmth,
  *making real*.
- **Color story = the tagline:** the top ("concept") uses cool, monochromatic **blueprint**
  tones; as you descend toward "reality," the **orange ignites**. Color temperature *tells*
  the transformation. This is an original system, not a template.

**Typography:**
- A display face with character for headlines (edge, not generic Inter) + a clean grotesk for body.
- A **monospace** accent for technical labels ("// proceso", "01 → idea") reinforcing the
  blueprint/spec-sheet language.

**Final hex values, exact type pairing, and motion curves are set during build** using the
design skills (`ui-ux-pro-max`, `frontend-design`, `motion-graphics`). This spec fixes the
*direction*, not the final tokens.

## 7. Motion Strategy

- **Guiding principle:** motion with purpose, never decorative — every animation serves the
  concept → reality narrative.
- **Signature moment:** scroll-driven **"rendering"** in the Process section — rough sketch →
  polished product as you scroll. No heavy scroll-jacking (gimmick risk) — smooth scroll-driven
  + IntersectionObserver.
- **Hero kinetic type:** "del concepto a la **realidad**" where "realidad" resolves/renders in.
- **Micro-interactions** over a polished product-led baseline: magnetic CTAs, cursor-aware
  blueprint grid, precise hovers.
- **Non-negotiable guardrails:** honor `prefers-reduced-motion`; 60fps; no layout thrash;
  motion in lazy islands; **degrade on mobile** (less motion, never broken).

## 8. Tech Approach

- **No framework migration.** Astro 5 SSR + React 19 + Tailwind 4 + Vercel stays.
- **Selective island hydration** (fixes current eager-load perf): hero and static sections →
  **SSR, no JS**. Interactive islands only where needed (`client:visible` / `client:idle`):
  AI chat, Process motion, micro-interactions. Remove blanket `client:load`.
- **Motion**: Motion library in islands + CSS scroll-driven for Process, gated behind
  `prefers-reduced-motion`.
- **i18n**: extend `translations.ts` with new keys (reframed services, process, cases, AI copy,
  CTAs) and execute the kill list. Keep the client-side nanostore mechanism for v1.
- **SEO / performance**: SSR hero stays indexable (preserves the recent Search Console work);
  fast LCP; lazy motion. Add **JSON-LD Organization** structured data.
- **Env / secrets**: new `AI_GATEWAY_API_KEY` in Vercel; existing SMTP vars unchanged.

## 9. Testing Strategy

The repo has **no test setup** today. Proposed, realistic (not gold-plated):
- **Vitest** unit tests: i18n utils; the intake guardrail/scoping logic.
- **Lightweight integration** for API routes: `/api/chat` streaming happy-path **and fallback**;
  `/api/contact` lead capture.
- **Manual/visual QA**: motion, `prefers-reduced-motion`, and mobile degradation.

## 10. Delivery / Phasing

This is a large change touching many files — **not a single mega-PR**. It will be sliced into
phases (chained/stacked PRs), detailed by the implementation plan:
1. **Foundations + design system** (palette, type, tokens, island strategy, kill-list cleanup).
2. **Sections** (Nav, Hero, Servicios, Casos, Confianza, CTA/contact, Footer).
3. **AI front door** (`/api/chat`, chat island, lead capture wiring, rate limiting, fallback).
4. **Process narrative + motion polish**.

## 11. Open Items to Resolve During Build

- Confirm the model choice via AI Gateway (provider/model string) and cost ceiling.
- Confirm available case-study assets (how many, with what metrics/screenshots) to size the
  Casos and Confianza sections.
- Decide whether to wire or remove `CookieConsent` (tied to analytics consent + AI data disclosure).
- Add an AI data-processing disclosure ("procesado por IA") in the chat panel.
