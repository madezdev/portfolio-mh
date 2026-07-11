import { useRef } from 'react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Container } from './primitives/Container';
import { BlueprintGrid } from './primitives/BlueprintGrid';
import { gsap, SplitText, useGSAP } from '../lib/gsap';
import { useMagnetic } from '../hooks/useMagnetic';
import { useLanguageSync } from '../hooks/useLanguageSync';

export default function StudioHero() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const root = useRef<HTMLElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.4);
  useLanguageSync();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Per-character reveal of the headline.
        const split1 = SplitText.create('.hero-line1-inner', { type: 'chars' });
        const split2 = SplitText.create('.hero-line2-inner', { type: 'chars' });

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('.hero-grid', { autoAlpha: 0, scale: 1.08, duration: 1.4, ease: 'power2.out' })
          .from('.hero-glow', { autoAlpha: 0, scale: 0.5, duration: 1.4, ease: 'power2.out' }, 0.15)
          .from('.hero-eyebrow', { autoAlpha: 0, y: 16, duration: 0.6 }, 0.35)
          .from(split1.chars, { yPercent: 130, autoAlpha: 0, stagger: 0.025, duration: 0.7 }, 0.45)
          .from(split2.chars, { yPercent: 130, autoAlpha: 0, stagger: 0.03, duration: 0.8 }, 0.62)
          .from('.hero-sub', { autoAlpha: 0, y: 18, duration: 0.7 }, 1.05)
          .from('.hero-cta', { autoAlpha: 0, y: 18, stagger: 0.12, duration: 0.6 }, 1.2)
          .from('.hero-scrollcue', { autoAlpha: 0, duration: 0.6 }, 1.45);

        // The ember glow breathes behind the headline (starts after the entrance).
        gsap.to('.hero-glow', {
          scale: 1.15,
          opacity: 0.55,
          duration: 3.6,
          delay: 1.7,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });

        // Cursor-reactive depth: the grid drifts and the glow follows the pointer.
        const gridX = gsap.quickTo('.hero-grid', 'xPercent', { duration: 0.9, ease: 'power3' });
        const glowX = gsap.quickTo('.hero-glow', 'x', { duration: 1.1, ease: 'power3' });
        const glowY = gsap.quickTo('.hero-glow', 'y', { duration: 1.1, ease: 'power3' });
        const onMove = (e: MouseEvent) => {
          const rx = e.clientX / window.innerWidth - 0.5;
          const ry = e.clientY / window.innerHeight - 0.5;
          gridX(rx * -2.5);
          glowX(rx * 60);
          glowY(ry * 60);
        };
        root.current?.addEventListener('mousemove', onMove);

        // Scroll parallax: content recedes + fades, grid drifts as you leave.
        const parallax = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.5 },
        });
        parallax
          .to('.hero-content', { yPercent: -14, autoAlpha: 0.25, ease: 'none' }, 0)
          .to('.hero-grid', { yPercent: 16, ease: 'none' }, 0);

        return () => {
          root.current?.removeEventListener('mousemove', onMove);
          split1.revert();
          split2.revert();
        };
      });
    },
    { dependencies: [lang], scope: root },
  );

  return (
    <section ref={root} id="top" className="relative flex min-h-[90vh] items-center overflow-hidden pb-24 pt-28">
      <div className="hero-grid absolute inset-0">
        <BlueprintGrid />
      </div>
      <div
        className="hero-glow pointer-events-none absolute inset-0 m-auto h-[44vh] w-[44vh] rounded-full opacity-40 blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgba(255,106,26,0.5), transparent 70%)' }}
        aria-hidden="true"
      />
      <Container className="hero-content relative z-10 text-center">
        <p className="hero-eyebrow mb-6 font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300">
          {t('hero.eyebrow')}
        </p>
        <h1 key={lang} className="font-display text-5xl font-bold leading-[1.05] md:text-7xl">
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
