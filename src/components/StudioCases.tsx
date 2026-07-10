import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { cases } from '../data/cases';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

export default function StudioCases() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  return (
    <Section id="cases" className="bg-ink-900/40">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-4">{t('cases.eyebrow')}</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-fg">{t('cases.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('cases.subtitle')}</p>

        {cases.length === 0 ? (
          <p className="mt-14 text-fg-muted">{t('cases.emptyLabel')}</p>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {cases.map((c) => (
              <article key={c.id} className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-950">
                <img src={c.image} alt={c.client || c.title} className="aspect-[16/10] w-full object-cover" />
                <div className="p-6">
                  <p className="font-mono text-xs uppercase tracking-widest text-ember-400">{c.client}</p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-fg">{c.title}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{c.summary}</p>
                  {c.testimonial && (
                    <blockquote className="mt-4 border-l-2 border-ember-500 pl-4 text-sm italic text-fg-muted">
                      "{c.testimonial.quote}"
                      <footer className="mt-1 not-italic text-xs text-fg-muted/80">
                        — {c.testimonial.author}, {c.testimonial.role}
                      </footer>
                    </blockquote>
                  )}
                  {c.liveUrl && (
                    <a
                      href={c.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ember-500 hover:text-ember-400"
                    >
                      {t('cases.liveLabel')} <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
