import { useRef } from 'react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Container } from './primitives/Container';
import { BlueprintGrid } from './primitives/BlueprintGrid';
import { gsap, useGSAP } from '../lib/gsap';
import { useMagnetic } from '../hooks/useMagnetic';

export default function StudioHero() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const root = useRef<HTMLElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.4);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Orchestrated load-in.
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('.hero-grid', { autoAlpha: 0, scale: 1.08, duration: 1.4, ease: 'power2.out' })
          .from('.hero-eyebrow', { autoAlpha: 0, y: 16, duration: 0.6 }, 0.25)
          .from('.hero-line1-inner', { yPercent: 120, duration: 0.9 }, 0.35)
          .from('.hero-line2-inner', { yPercent: 120, duration: 1.0 }, 0.5)
          .from('.hero-sub', { autoAlpha: 0, y: 18, duration: 0.7 }, 0.9)
          .from('.hero-cta', { autoAlpha: 0, y: 18, stagger: 0.12, duration: 0.6 }, 1.05)
          .from('.hero-scrollcue', { autoAlpha: 0, duration: 0.6 }, 1.3);

        // Scroll parallax: the grid drifts down, the content recedes + fades as
        // you leave the hero (clean, no dead-scroll gap).
        const parallax = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.5 },
        });
        parallax
          .to('.hero-content', { yPercent: -14, autoAlpha: 0.25, ease: 'none' }, 0)
          .to('.hero-grid', { yPercent: 16, ease: 'none' }, 0);
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative flex min-h-[90vh] items-center overflow-hidden pb-24 pt-28">
      <div className="hero-grid absolute inset-0">
        <BlueprintGrid />
      </div>
      <Container className="hero-content relative z-10 text-center">
        <p className="hero-eyebrow mb-6 font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300">
          {t('hero.eyebrow')}
        </p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-7xl">
          <span className="block overflow-hidden pb-[0.08em]">
            <span className="hero-line1-inner block text-fg">{t('hero.title.line1')}</span>
          </span>
          <span className="block overflow-hidden pb-[0.08em]">
            <span className="hero-line2-inner block text-ember-500">{t('hero.title.line2')}</span>
          </span>
        </h1>
        <p className="hero-sub mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted md:text-xl">
          {t('hero.subtitle')}
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <a
            ref={ctaRef}
            href="#ai"
            className="hero-cta inline-block rounded-full bg-ember-500 px-8 py-4 font-semibold text-ink-950 transition-colors hover:bg-ember-400"
          >
            {t('hero.cta.primary')}
          </a>
          <a
            href="#cases"
            className="hero-cta rounded-full border border-ink-700 px-8 py-4 font-semibold text-fg transition-colors hover:bg-ink-800"
          >
            {t('hero.cta.secondary')}
          </a>
        </div>
      </Container>

      <a
        href="#services"
        aria-label={lang === 'es' ? 'Bajar a servicios' : 'Scroll to services'}
        className="hero-scrollcue group absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted/60 transition-colors group-hover:text-fg-muted">
          scroll
        </span>
        <span className="scroll-cue-line h-10 w-px bg-gradient-to-b from-ember-500/70 to-transparent" aria-hidden="true" />
      </a>
    </section>
  );
}
