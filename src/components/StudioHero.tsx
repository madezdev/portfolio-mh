import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Container } from './primitives/Container';
import { BlueprintGrid } from './primitives/BlueprintGrid';

export default function StudioHero() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  return (
    <section id="top" className="relative flex min-h-[90vh] items-center overflow-hidden pb-24 pt-28">
      <BlueprintGrid />
      <Container className="relative z-10 text-center">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300">
          {t('hero.eyebrow')}
        </p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-7xl">
          <span className="block text-fg">{t('hero.title.line1')}</span>
          <span className="hero-reveal block text-ember-500">{t('hero.title.line2')}</span>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted md:text-xl">
          {t('hero.subtitle')}
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href="#ai"
            className="rounded-full bg-ember-500 px-8 py-4 font-semibold text-ink-950 transition-colors hover:bg-ember-400"
          >
            {t('hero.cta.primary')}
          </a>
          <a
            href="#cases"
            className="rounded-full border border-ink-700 px-8 py-4 font-semibold text-fg transition-colors hover:bg-ink-800"
          >
            {t('hero.cta.secondary')}
          </a>
        </div>
      </Container>

      <a
        href="#services"
        aria-label={lang === 'es' ? 'Bajar a servicios' : 'Scroll to services'}
        className="group absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted/60 transition-colors group-hover:text-fg-muted">
          scroll
        </span>
        <span className="scroll-cue-line h-10 w-px bg-gradient-to-b from-ember-500/70 to-transparent" aria-hidden="true" />
      </a>
    </section>
  );
}
