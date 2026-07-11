import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { useReveal } from '../hooks/useReveal';
import { gsap, useGSAP } from '../lib/gsap';
import { cases, type Case } from '../data/cases';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

function CaseVisual({ item }: { item: Case }) {
  if (item.image) {
    return <img src={item.image} alt={item.client} className="case-media aspect-[16/10] w-full scale-110 object-cover" />;
  }
  // Branded fallback tile when no product screenshot is available yet.
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-900" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(107,138,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(107,138,255,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <span className="case-media absolute inset-0 flex items-center justify-center font-display text-8xl font-bold text-ink-700 select-none">
        {item.client.charAt(0)}
      </span>
      {item.tag && (
        <span className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.2em] text-blueprint-300">
          {item.tag}
        </span>
      )}
    </div>
  );
}

export default function StudioCases() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  useReveal('cases');

  // Depth: each case visual drifts against its card as it scrolls through view.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('#cases .case-media').forEach((media) => {
        gsap.fromTo(
          media,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: media.closest('article'), start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    });
  });

  return (
    <Section id="cases" className="bg-ink-900/40">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-4">{t('cases.eyebrow')}</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-fg">{t('cases.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('cases.subtitle')}</p>

        {cases.length === 0 ? (
          <p className="mt-14 text-fg-muted">{t('cases.emptyLabel')}</p>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <article
                key={c.id}
                className="reveal group overflow-hidden rounded-2xl border border-ink-800 bg-ink-950 transition-colors hover:border-ember-500/40"
              >
                <CaseVisual item={c} />
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
