import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Container } from './primitives/Container';
import { InteractiveBlueprint } from './InteractiveBlueprint';
import { gsap, SplitText, useGSAP } from '../lib/gsap';
import { useMagnetic } from '../hooks/useMagnetic';

export default function StudioHero() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const root = useRef<HTMLElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.4);

  // Ambient ember light beams that rise behind the headline. Generated on the
  // client only (Math.random), so the server renders none and hydration stays
  // identical — no SSR mismatch. Each beam carries its own duration/delay via
  // CSS custom properties so the motion never looks mechanically uniform.
  const [beams, setBeams] = useState<Array<{ id: number; accent: boolean; style: CSSProperties }>>([]);
  useEffect(() => {
    const generated = Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      accent: Math.random() < 0.18,
      style: {
        left: `${Math.random() * 100}%`,
        width: Math.random() < 0.28 ? '2px' : '1px',
        '--beam-dur': `${(Math.random() * 3 + 6).toFixed(2)}s`,
        '--beam-delay': `${(Math.random() * 7).toFixed(2)}s`,
      } as CSSProperties,
    }));
    setBeams(generated);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // "Concept" assembles char by char; "reality" arrives as one solid block.
        const split1 = SplitText.create('.hero-line1-inner', { type: 'chars' });

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('.hero-grid', { autoAlpha: 0, scale: 1.08, duration: 1.4, ease: 'power2.out' })
          .from('.hero-glow', { autoAlpha: 0, scale: 0.5, duration: 1.4, ease: 'power2.out' }, 0.15)
          .from('.hero-eyebrow', { autoAlpha: 0, y: 16, duration: 0.6 }, 0.35)
          .from(split1.chars, { yPercent: 130, autoAlpha: 0, stagger: 0.025, duration: 0.7 }, 0.45)
          .from('.hero-line2-inner', { yPercent: 120, duration: 0.9 }, 0.66)
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

        // Cursor-reactive glow (the grid reacts on its own canvas layer).
        const glowX = gsap.quickTo('.hero-glow', 'x', { duration: 1.1, ease: 'power3' });
        const glowY = gsap.quickTo('.hero-glow', 'y', { duration: 1.1, ease: 'power3' });
        const onMove = (e: MouseEvent) => {
          const rx = e.clientX / window.innerWidth - 0.5;
          const ry = e.clientY / window.innerHeight - 0.5;
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
        };
      });
    },
    { scope: root },
  );

  // Ember light sweep across "reality": the word sits solid, and every few
  // seconds a warm highlight travels across it. Lives in its own effect keyed
  // to `lang` so it re-attaches when the <h1> remounts on a language toggle.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const sweep = gsap.fromTo(
          '.hero-line2-inner',
          { backgroundPosition: '100% 0' },
          {
            backgroundPosition: '-45% 0',
            duration: 1.9,
            ease: 'power2.inOut',
            repeat: -1,
            repeatDelay: 2.8,
            delay: 2.4,
          },
        );
        return () => sweep.kill();
      });
    },
    { dependencies: [lang], scope: root },
  );

  return (
    <section ref={root} id="top" className="relative flex min-h-[90vh] items-center overflow-hidden pb-24 pt-28">
      {/* Blueprint grid — cool structural underlayer (cursor-reactive canvas). */}
      <div className="hero-grid absolute inset-0">
        <InteractiveBlueprint />
      </div>

      {/* Studio lighting rig: a warm key light and a cool fill light, framed by a
          vignette and finished with film grain, so the section reads like a lit
          set rather than a flat dark page. Ambient layers stay static — the
          "room lights" are on while the headline assembles over them. */}
      <div
        className="hero-wash pointer-events-none absolute left-1/2 top-[-18%] h-[78vh] w-[78vh] -translate-x-1/2 rounded-full opacity-30 blur-[130px]"
        style={{ background: 'radial-gradient(circle, rgba(255,138,61,0.32), transparent 68%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-12%] left-[10%] h-[46vh] w-[46vh] rounded-full opacity-25 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(107,138,255,0.30), transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="hero-glow pointer-events-none absolute inset-0 m-auto h-[44vh] w-[44vh] rounded-full opacity-50 blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgba(255,106,26,0.55), transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Rising ember light beams — the "come to life" layer, adapted to the
          studio's warm palette and kept restrained (14, thin, slow). */}
      <div className="hero-beams pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {beams.map((b) => (
          <span key={b.id} className={b.accent ? 'hero-beam hero-beam--accent' : 'hero-beam'} style={b.style} />
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(125% 90% at 50% 36%, transparent 42%, rgba(5,5,6,0.6) 100%)' }}
        aria-hidden="true"
      />
      <div
        className="hero-grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
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
            <span
              className="hero-line2-inner block"
              style={{
                backgroundImage:
                  'linear-gradient(100deg, #ff6a1a 0%, #ff6a1a 42%, #ffe4cf 50%, #ff6a1a 58%, #ff6a1a 100%)',
                backgroundSize: '250% 100%',
                backgroundPosition: '100% 0',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              {t('hero.title.line2')}
            </span>
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
