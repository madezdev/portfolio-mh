import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

const SUBJECTS = ['web', 'product', 'automation', 'ai', 'other'] as const;

export default function StudioContact() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      subject: String(data.get('subject') ?? ''),
      message: String(data.get('message') ?? ''),
      language: lang,
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) throw new Error('failed');
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  const field = 'w-full rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 text-fg placeholder-fg-muted/60 focus:border-ember-500 focus:outline-none';

  return (
    <Section id="contact">
      <Container className="max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-4">{t('contact.eyebrow')}</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-fg">{t('contact.title')}</h2>
        <p className="mt-4 text-lg text-fg-muted">{t('contact.subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-fg-muted">{t('contact.form.name')}</label>
            <input id="name" name="name" type="text" required className={field} placeholder={t('contact.form.namePlaceholder')} />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-fg-muted">{t('contact.form.email')}</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={field} placeholder={t('contact.form.emailPlaceholder')} />
          </div>
          <div>
            <label htmlFor="subject" className="mb-2 block text-sm text-fg-muted">{t('contact.form.subject')}</label>
            <select id="subject" name="subject" required defaultValue="" className={field}>
              <option value="" disabled>{t('contact.form.subjectPlaceholder')}</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{t(`contact.subjects.${s}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm text-fg-muted">{t('contact.form.message')}</label>
            <textarea id="message" name="message" rows={5} required className={`${field} resize-none`} placeholder={t('contact.form.messagePlaceholder')} />
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full rounded-full bg-ember-500 px-6 py-4 font-semibold text-ink-950 hover:bg-ember-400 disabled:opacity-60"
          >
            {status === 'sending' ? t('contact.form.sending') : t('contact.form.submit')}
          </button>
          {status === 'success' && <p className="text-sm text-ember-400">{t('contact.form.success')}</p>}
          {status === 'error' && <p className="text-sm text-red-400">{t('contact.form.error')}</p>}
        </form>
      </Container>
    </Section>
  );
}
