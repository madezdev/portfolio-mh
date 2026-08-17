import { useRef } from 'react';
import type { Language } from '../i18n/translations';
import { useTranslations } from '../i18n/utils';
import { Container } from './primitives/Container';
import { HeroField, HERO_IGNITE_AT, HERO_HORIZON } from './HeroField';
import { gsap, SplitText, useGSAP } from '../lib/gsap';
import { useMagnetic } from '../hooks/useMagnetic';

/** Width of the headline spotlight, matching `--hero-spot` in global.css. */
const SPOT = 460;

export default function StudioHero({ lang }: { lang: Language }) {
  const { t } = useTranslations(lang);
  const root = useRef<HTMLElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.4);
  // The headline spotlight can only be armed once SplitText has been reverted —
  // `background-clip: text` and transformed per-char spans do not coexist.
  const litReady = useRef(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // "Concept" assembles char by char; "reality" arrives as one solid block.
        const split1 = SplitText.create('.hero-line1-inner', { type: 'chars' });
        let splitReverted = false;
        const revertSplit = () => {
          if (splitReverted) return;
          splitReverted = true;
          split1.revert();
        };

        // The room switches on at HERO_IGNITE_AT, in step with the canvas
        // wavefront, and the headline lands into an already-lit set.
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          onComplete: () => {
            revertSplit();
            litReady.current = true;
            root.current?.querySelector('.hero-line1-inner')?.classList.add('is-lit');
          },
        });
        tl.from('.hero-wash', { autoAlpha: 0, duration: 1.6, ease: 'power2.out' }, HERO_IGNITE_AT)
          .from('.hero-fill', { autoAlpha: 0, duration: 1.8, ease: 'power2.out' }, HERO_IGNITE_AT)
          .from('.hero-pulse', { autoAlpha: 0, duration: 1.8, ease: 'power2.out' }, HERO_IGNITE_AT)
          .from('.hero-glow', { autoAlpha: 0, scale: 0.5, duration: 1.4, ease: 'power2.out' }, HERO_IGNITE_AT)
          .from(
            '.hero-horizon-line',
            { scaleX: 0, autoAlpha: 0, duration: 1.2, ease: 'power2.out' },
            HERO_IGNITE_AT + 0.05,
          )
          .from('.hero-horizon-bloom', { autoAlpha: 0, duration: 1.6 }, HERO_IGNITE_AT + 0.15)
          .from('.hero-eyebrow', { autoAlpha: 0, y: 16, duration: 0.6 }, 0.55)
          .from(split1.chars, { yPercent: 130, autoAlpha: 0, stagger: 0.025, duration: 0.7 }, 0.65)
          .from('.hero-line2-inner', { yPercent: 120, duration: 0.9 }, 0.86)
          .from('.hero-sub', { autoAlpha: 0, y: 18, duration: 0.7 }, 1.25)
          .from('.hero-cta', { autoAlpha: 0, y: 18, stagger: 0.12, duration: 0.6 }, 1.4)
          .from('.hero-scrollcue', { autoAlpha: 0, duration: 0.6 }, 1.65);

        // Two lights breathing on different periods, so the room never pulses
        // metronomically. They live on separate elements on purpose: .hero-glow
        // is already driven by the entrance, this tween, and quickTo x/y.
        gsap.to('.hero-glow', {
          scale: 1.12,
          opacity: 0.62,
          duration: 5.2,
          delay: 2,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
        gsap.to('.hero-pulse', {
          scale: 1.18,
          opacity: 0.3,
          duration: 7.4,
          delay: 1.2,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
        gsap.to('.hero-horizon-line', {
          opacity: 1,
          duration: 4.4,
          delay: 2.4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });

        // Cursor parallax at different rates per layer — opposing directions on
        // the soft layers is what reads as depth. The grid reacts further on its
        // own canvas layer.
        const layer = (selector: string, duration: number, ax: number, ay: number) => ({
          x: gsap.quickTo(selector, 'x', { duration, ease: 'power3' }),
          y: gsap.quickTo(selector, 'y', { duration, ease: 'power3' }),
          ax,
          ay,
        });
        const layers = [
          layer('.hero-grid', 1.3, 10, 10),
          layer('.hero-glow', 1.1, 60, 60),
          layer('.hero-pulse', 1.5, -34, -20),
          layer('.hero-horizon', 1.35, -26, -14),
          layer('.hero-content', 1.6, 5, 4),
        ];
        const onMove = (e: MouseEvent) => {
          const rx = e.clientX / window.innerWidth - 0.5;
          const ry = e.clientY / window.innerHeight - 0.5;
          for (const l of layers) {
            l.x(rx * l.ax);
            l.y(ry * l.ay);
          }
        };
        root.current?.addEventListener('mousemove', onMove, { passive: true });

        // Scroll parallax: content recedes + fades, grid drifts, lights go out.
        const parallax = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.5 },
        });
        parallax
          .to('.hero-content', { yPercent: -14, autoAlpha: 0.25, ease: 'none' }, 0)
          .to('.hero-grid', { yPercent: 16, ease: 'none' }, 0)
          .to('.hero-horizon', { autoAlpha: 0, ease: 'none' }, 0);

        return () => {
          root.current?.removeEventListener('mousemove', onMove);
          revertSplit();
        };
      });
    },
    { scope: root },
  );

  // Ember light sweep across "reality", plus the cursor spotlight on "concept".
  // Both live here, keyed to `lang`, so they re-attach when the <h1> remounts on
  // a language toggle.
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

        const line = root.current?.querySelector<HTMLElement>('.hero-line1-inner');
        if (!line || window.matchMedia('(pointer: coarse)').matches) {
          return () => sweep.kill();
        }

        // On a language toggle the entrance has already run, so re-arm at once.
        if (litReady.current) line.classList.add('is-lit');

        const setX = gsap.quickSetter(line, '--sx', 'px');
        const setY = gsap.quickSetter(line, '--sy', 'px');
        let targetX = -9999;
        let targetY = -9999;
        let currentX = -9999;
        let currentY = -9999;
        let bounds = line.getBoundingClientRect();

        const refresh = () => {
          bounds = line.getBoundingClientRect();
        };
        const onMove = (e: MouseEvent) => {
          targetX = e.clientX - bounds.left - SPOT / 2;
          targetY = e.clientY - bounds.top - SPOT / 2;
        };
        const tick = () => {
          currentX += (targetX - currentX) * 0.14;
          currentY += (targetY - currentY) * 0.14;
          setX(currentX);
          setY(currentY);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('scroll', refresh, { passive: true });
        window.addEventListener('resize', refresh);
        gsap.ticker.add(tick);

        return () => {
          sweep.kill();
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('scroll', refresh);
          window.removeEventListener('resize', refresh);
          gsap.ticker.remove(tick);
        };
      });
    },
    { dependencies: [lang], scope: root },
  );

  return (
    <section ref={root} id="top" className="relative flex min-h-[90vh] items-center overflow-hidden pb-24 pt-28">
      {/* Blueprint grid, embers and the cursor light all live on one canvas. */}
      <div className="hero-grid absolute inset-0">
        <HeroField />
      </div>

      {/* Studio lighting rig: a warm key light, a cool fill, and two ember cores
          breathing on different periods so the room never pulses mechanically. */}
      <div
        className="hero-wash pointer-events-none absolute left-1/2 top-[-10%] h-[62vh] w-[62vh] -translate-x-1/2 rounded-full opacity-[0.42] blur-[90px]"
        style={{ background: 'radial-gradient(circle, rgba(255,138,61,0.34), transparent 66%)' }}
        aria-hidden="true"
      />
      <div
        className="hero-fill pointer-events-none absolute bottom-[-12%] left-[6%] h-[48vh] w-[48vh] rounded-full opacity-30 blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgba(107,138,255,0.32), transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="hero-pulse pointer-events-none absolute inset-0 m-auto h-[52vh] w-[52vh] rounded-full opacity-[0.18] blur-[130px]"
        style={{ background: 'radial-gradient(circle, rgba(255,138,61,0.5), transparent 72%)' }}
        aria-hidden="true"
      />
      <div
        className="hero-glow pointer-events-none absolute inset-0 m-auto h-[42vh] w-[42vh] rounded-full opacity-[0.38] blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(255,106,26,0.6), transparent 70%)' }}
        aria-hidden="true"
      />

      {/* The one hard edge in the composition: a lit floor for the set. Without
          it every layer is a soft blur and the eye reads the section as empty. */}
      <div
        className="hero-horizon pointer-events-none absolute inset-x-0"
        style={{ top: `${HERO_HORIZON * 100}%` }}
        aria-hidden="true"
      >
        <div
          className="hero-horizon-bloom absolute inset-x-0 -top-[55px] h-[110px]"
          style={{ background: 'radial-gradient(58% 100% at 50% 50%, rgba(255,106,26,0.18), transparent 72%)' }}
        />
        <div className="hero-horizon-line relative h-px" />
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
        aria-label={t('hero.scrollAria')}
        className="hero-scrollcue group absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted/60 transition-colors group-hover:text-fg-muted">
          {t('hero.scroll')}
        </span>
        <span className="scroll-cue-line h-10 w-px bg-gradient-to-b from-ember-500/70 to-transparent" aria-hidden="true" />
      </a>
    </section>
  );
}
