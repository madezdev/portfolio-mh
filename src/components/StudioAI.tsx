import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

function messageText(m: { parts: Array<{ type: string; text?: string }> }): string {
  return m.parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('');
}

export default function StudioAI() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const [input, setInput] = useState('');
  const [captured, setCaptured] = useState(false);
  const [captureError, setCaptureError] = useState(false);

  const assistantReplies = messages.filter((m) => m.role === 'assistant').length;
  const showCapture = assistantReplies >= 2 && !captured;

  function send(text: string) {
    const value = text.trim();
    if (!value || status !== 'ready') return;
    sendMessage({ text: value });
    setInput('');
  }

  async function handleCapture(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Visitante' : 'IA'}: ${messageText(m)}`)
      .join('\n');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          subject: 'Lead desde la IA',
          message: `Conversación de intake:\n\n${transcript}`,
          language: lang,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error('failed');
      setCaptureError(false);
      setCaptured(true);
    } catch {
      setCaptureError(true);
    }
  }

  const field = 'w-full rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 text-fg placeholder-fg-muted/60 focus:border-ember-500 focus:outline-none';

  return (
    <Section id="ai" className="border-t border-ink-800">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300">{t('ai.eyebrow')}</p>
          <h2 className="font-display text-4xl font-bold text-fg md:text-5xl">{t('ai.title')}</h2>
          <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('ai.subtitle')}</p>

          <div className="mt-10 rounded-2xl border border-ink-800 bg-ink-900/40 p-4 md:p-6">
            {status === 'error' ? (
              <div className="py-8 text-center">
                <p className="text-fg-muted">{t('ai.fallback.text')}</p>
                <a href="#contact" className="mt-4 inline-block font-semibold text-ember-500 hover:text-ember-400">
                  {t('ai.fallback.cta')} →
                </a>
              </div>
            ) : (
              <>
                {messages.length > 0 && (
                  <div className="mb-4 max-h-80 space-y-4 overflow-y-auto">
                    {messages.map((m) => (
                      <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                        <span
                          className={
                            'inline-block max-w-[85%] rounded-2xl px-4 py-2 text-sm ' +
                            (m.role === 'user' ? 'bg-ember-500 text-ink-950' : 'bg-ink-800 text-fg')
                          }
                        >
                          {messageText(m)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {messages.length === 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => send(t(`ai.chips.${i}`))}
                        className="rounded-full border border-ink-700 px-4 py-2 text-sm text-fg-muted transition-colors hover:border-ember-500/50 hover:text-fg"
                      >
                        {t(`ai.chips.${i}`)}
                      </button>
                    ))}
                  </div>
                )}

                {showCapture ? (
                  captured ? (
                    <p className="text-sm text-ember-400">{t('ai.capture.success')}</p>
                  ) : captureError ? (
                    <div className="py-4 text-center">
                      <p className="text-sm text-fg-muted">{t('ai.fallback.text')}</p>
                      <a href="#contact" className="mt-2 inline-block font-semibold text-ember-500 hover:text-ember-400">
                        {t('ai.fallback.cta')} →
                      </a>
                    </div>
                  ) : (
                    <form onSubmit={handleCapture} className="space-y-3">
                      <p className="text-sm text-fg-muted">{t('ai.capture.prompt')}</p>
                      <input name="name" required className={field} placeholder={t('ai.capture.name')} />
                      <input name="email" type="email" required autoComplete="email" className={field} placeholder={t('ai.capture.email')} />
                      <button type="submit" className="w-full rounded-full bg-ember-500 px-6 py-3 font-semibold text-ink-950 hover:bg-ember-400">
                        {t('ai.capture.submit')}
                      </button>
                    </form>
                  )
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(input);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={status !== 'ready'}
                      className={field}
                      placeholder={t('ai.inputPlaceholder')}
                      aria-label={t('ai.inputPlaceholder')}
                    />
                    <button
                      type="submit"
                      disabled={status !== 'ready'}
                      className="rounded-full bg-ember-500 px-6 py-3 font-semibold text-ink-950 hover:bg-ember-400 disabled:opacity-60"
                    >
                      {t('ai.send')}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-fg-muted/60">{t('ai.disclosure')}</p>
        </div>
      </Container>
    </Section>
  );
}
