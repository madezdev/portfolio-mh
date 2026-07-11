import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useReveal } from '../hooks/useReveal';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

const STEPS = ['idea', 'design', 'build', 'ship'] as const;

export default function StudioProcess() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  useReveal('process');

  // Reliable JS scroll-driven fill: the connector "draws" from blueprint→ember
  // as the section scrolls past a reference line. Reduced-motion → full line.
  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height === 0) return;
      // Fill maps the connector's top position as it travels up the viewport:
      // ~0 when it enters from the bottom, ~1 as it nears the top.
      const vh = window.innerHeight;
      const p = (vh * 0.85 - rect.top) / (vh * 0.7);
      setProgress(Math.min(1, Math.max(0, p)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [reduced]);

  return (
    <Section id="process" className="border-t border-ink-800">
      <Container>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300">{t('process.eyebrow')}</p>
        <h2 className="font-display text-4xl font-bold text-fg md:text-5xl">{t('process.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('process.subtitle')}</p>

        <div ref={trackRef} className="relative mt-16 pl-10">
          {/* Connector: visible track + scroll-driven ember fill + a glowing head
              that descends as you scroll (concept→reality "drawing itself"). */}
          <div className="pointer-events-none absolute left-1.5 top-2 bottom-2 w-[3px]" aria-hidden="true">
            <div className="absolute inset-0 rounded-full bg-ink-700" />
            <div
              className="absolute inset-x-0 top-0 h-full origin-top rounded-full bg-gradient-to-b from-blueprint-400 to-ember-500"
              style={{ transform: `scaleY(${progress})` }}
            />
            <div
              className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-400"
              style={{
                top: `${progress * 100}%`,
                boxShadow: '0 0 16px 4px rgba(255, 138, 61, 0.7)',
                opacity: reduced ? 0 : 1,
              }}
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
