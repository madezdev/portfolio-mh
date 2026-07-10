import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

const PILLARS = ['web', 'product', 'automation', 'ai'] as const;

export default function StudioServices() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  return (
    <Section id="services">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-4">
          // servicios
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-fg">{t('services.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('services.subtitle')}</p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {PILLARS.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-ink-800 bg-ink-900/60 p-8 transition-colors hover:border-ember-500/50"
            >
              <h3 className="font-display text-2xl font-semibold text-fg">
                {t(`services.pillars.${key}.title`)}
              </h3>
              <p className="mt-3 text-fg-muted">{t(`services.pillars.${key}.description`)}</p>
              <ul className="mt-6 space-y-2">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center text-sm text-fg-muted">
                    <span className="mr-2 text-ember-500" aria-hidden="true">→</span>
                    {t(`services.pillars.${key}.outcomes.${i}`)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
