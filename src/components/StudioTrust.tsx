import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { getClientLogos, getTestimonials } from '../data/cases';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

export default function StudioTrust() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const logos = getClientLogos();
  const testimonials = getTestimonials();

  if (logos.length === 0 && testimonials.length === 0) return null;

  return (
    <Section id="trust">
      <Container>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-fg">{t('trust.title')}</h2>
        <p className="mt-3 max-w-2xl text-fg-muted">{t('trust.subtitle')}</p>

        {logos.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-10 opacity-80">
            {logos.map((l) => (
              <img key={l.client} src={l.logo} alt={l.client} className="h-8 w-auto grayscale" />
            ))}
          </div>
        )}

        {testimonials.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {testimonials.map((tm) => (
              <blockquote key={tm.client} className="rounded-2xl border border-ink-800 bg-ink-900/60 p-6">
                <p className="text-fg">"{tm.quote}"</p>
                <footer className="mt-3 text-sm text-fg-muted">— {tm.author}, {tm.role}</footer>
              </blockquote>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
