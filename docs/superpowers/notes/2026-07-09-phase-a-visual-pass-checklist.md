# Phase A — Joint Visual Polish Pass Checklist

Phase A (foundations + design system + shell) is code-complete, all tests green, final
review = "ready to merge". Per the execution decision, the **visual craft was deferred to
a joint human-in-the-loop pass**. This is that checklist — run it with `npm run dev` live,
invoking the design skills (`frontend-design`, `motion-graphics`, `ui-ux-pro-max`).

## Must do in the visual pass

- [ ] **Restyle `src/components/LanguageToggle.tsx` to the ink/ember system.** It still uses
  the old `bg-slate-800/50`, `border-slate-700`, `text-gray-300` palette and now sits next
  to the ember CTA in `StudioNav` — a slate pill against orange. (Final-review Minor.)
- [ ] **Nav polish** (`StudioNav`): glass-on-scroll behavior, ember CTA refinement, and a11y —
  add `aria-label` to the `<nav>` landmark and `aria-current` for the active section.
- [ ] **Hero kinetic type + color temperature** (`StudioHero`): lock the "realidad" kinetic
  treatment and the concept→reality warm-up with `motion-graphics`.
- [ ] **Fix hero first-paint flicker for motion-enabled users** (`StudioHero.tsx`): because
  `usePrefersReducedMotion` defaults to `true`, the accent word paints visible, then the
  effect flips `reduced→false` and `initial:{opacity:0}` can animate visible→0→1. Seed the
  reduced-motion value or gate the initial state so motion-enabled users don't see a flash.
- [ ] **Live token-render QA:** run `npm run dev`, confirm the `@theme` tokens compile to real
  utilities (ink base, ember accent, display/mono fonts) and the layout holds on mobile.
- [ ] **Copy check in context:** confirm the exact ES hero `line2` ("la realidad") and the
  eyebrow/subtitle read well at real sizes.
- [ ] **Reduced-motion + mobile degradation** verified visually across Nav/Hero/Footer.

## Confirmed data (already applied)
- Footer socials: `github.com/madezdev`, `linkedin.com/company/madezdev` (owner-confirmed).
- Footer: only GitHub + LinkedIn for now (no X/Instagram).

## Track for later phases (NOT this visual pass)
- **SSR language mismatch (SEO phase):** React islands render server-side off the nanostore
  default `'es'`, while `<html lang>`/title/meta/JSON-LD derive from `Accept-Language`. For an
  EN visitor the SSR body is ES under `lang="en"` until hydration. This is the deliberate
  client-side-i18n architecture (design spec keeps it for v1); a future phase should seed the
  store from the server-resolved `lang` or add `/es` `/en` routes.
- **Defined-but-unused i18n keys** `brand.tagline`, `footer.servicesTitle` — confirm they are
  intended forward keys for later phases (they are staged, not orphaned).
- **Old unused components** (`Navigation, Hero, About, Services, TeamWork, Skills, Contact,
  Footer`) remain in `src/components/` but are no longer rendered — Phases B/C replace/remove them.
- **npm audit:** 26 pre-existing vulns (not introduced by Phase A) — separate follow-up.
