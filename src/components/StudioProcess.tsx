import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

const STEPS = ['idea', 'design', 'build', 'ship'] as const;

export default function StudioProcess() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  return (
    <Section id="process" className="border-t border-ink-800">
      <Container>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300">{t('process.eyebrow')}</p>
        <h2 className="font-display text-4xl font-bold text-fg md:text-5xl">{t('process.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('process.subtitle')}</p>

        <div className="relative mt-16 pl-10">
          {/* Connector: static track (blueprint→ember) + scroll-driven fill */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-blueprint-400/30 to-ember-500/30" aria-hidden="true" />
          <div className="process-progress absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-blueprint-400 to-ember-500" aria-hidden="true" />

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
