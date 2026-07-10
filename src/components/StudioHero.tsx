import { useStore } from '@nanostores/react';
import { motion } from 'motion/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { Container } from './primitives/Container';
import { BlueprintGrid } from './primitives/BlueprintGrid';

export default function StudioHero() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const reduced = usePrefersReducedMotion();

  const line2Motion = reduced
    ? {}
    : { initial: { opacity: 0, y: '0.3em' }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } };

  return (
    <section id="top" className="relative min-h-[92vh] flex items-center overflow-hidden">
      <BlueprintGrid />
      <Container className="relative z-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-6">
          {t('hero.eyebrow')}
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05]">
          <span className="block text-fg">{t('hero.title.line1')}</span>
          <motion.span className="block text-ember-500" {...line2Motion}>
            {t('hero.title.line2')}
          </motion.span>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-fg-muted leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#ai"
            className="rounded-full bg-ember-500 px-8 py-4 font-semibold text-ink-950 hover:bg-ember-400 transition-colors"
          >
            {t('hero.cta.primary')}
          </a>
          <a
            href="#cases"
            className="rounded-full border border-ink-700 px-8 py-4 font-semibold text-fg hover:bg-ink-800 transition-colors"
          >
            {t('hero.cta.secondary')}
          </a>
        </div>
      </Container>
    </section>
  );
}
