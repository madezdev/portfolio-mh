import { useRef } from 'react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { useReveal } from '../hooks/useReveal';
import { gsap, useGSAP } from '../lib/gsap';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

const STEPS = ['idea', 'design', 'build', 'ship'] as const;

export default function StudioProcess() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  useReveal('process');

  // The connector "draws" concept→reality: an ember fill + a glowing head that
  // descend as the section scrolls, scrubbed by GSAP. Reduced-motion → full line,
  // no head (the fill's default state is already full; GSAP only runs otherwise).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(fillRef.current, { scaleY: 0, transformOrigin: 'top' });
        gsap.set(headRef.current, { top: '0%', autoAlpha: 1 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: trackRef.current, start: 'top 78%', end: 'bottom 55%', scrub: 0.4 },
        });
        tl.to(fillRef.current, { scaleY: 1, ease: 'none' }, 0).to(headRef.current, { top: '100%', ease: 'none' }, 0);
      });
    },
    { scope: trackRef },
  );

  return (
    <Section id="process" className="border-t border-ink-800">
      <Container>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300">{t('process.eyebrow')}</p>
        <h2 className="font-display text-4xl font-bold text-fg md:text-5xl">{t('process.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('process.subtitle')}</p>

        <div ref={trackRef} className="relative mt-16 pl-10">
          <div className="pointer-events-none absolute left-1.5 top-2 bottom-2 w-[3px]" aria-hidden="true">
            <div className="absolute inset-0 rounded-full bg-ink-700" />
            <div
              ref={fillRef}
              className="absolute inset-x-0 top-0 h-full origin-top rounded-full bg-gradient-to-b from-blueprint-400 to-ember-500"
            />
            <div
              ref={headRef}
              className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-400 opacity-0"
              style={{ top: '0%', boxShadow: '0 0 16px 4px rgba(255, 138, 61, 0.7)' }}
            />
          </div>

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
