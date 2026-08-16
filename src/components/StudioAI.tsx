import { useEffect, useRef, useState } from 'react';
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

  // Keep the newest message and streaming tokens in view as they arrive.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

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

  // Radius is left to each call site: the capture fields are a stacked form and take
  // `rounded-lg`, while the chat composer is a pill beside a round send button.
  // Combining both here and overriding per site would depend on Tailwind's output
  // order rather than the order of the class string, which is not a guarantee.
  const field = 'w-full border border-ink-700 bg-ink-900 px-4 py-3 text-fg placeholder-fg-muted/60 focus:border-ember-500 focus:outline-none';

  return (
    <Section id="ai" className="border-t border-ink-800">
      <Container>
        {/* Capped, but anchored to the container's left edge rather than centred:
            every section header on the page shares that rail, and a block centred
            inside the container starts 168px further in than its neighbours. */}
        <div className="max-w-3xl">
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
                {/* `overscroll-contain` stops a flick inside the transcript from
                    chaining to the page once it hits either end — on a phone the panel
                    is most of the screen, so that hand-off is easy to trigger and
                    throws the reader out of the conversation. */}
                {messages.length > 0 && (
                  <div ref={scrollRef} className="mb-4 max-h-80 space-y-4 overflow-y-auto overscroll-contain">
                    {messages.map((m) => (
                      <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                        <span
                          className={
                            // `break-words`: a URL or any long unbroken token is wider
                            // than the 85% cap and spills straight out of the bubble.
                            // `text-left`: only the bubble's SIDE should change with the
                            // role. Inheriting `text-right` ragged-lefts the user's own
                            // text, which is where wrapping is worst on a narrow screen.
                            'inline-block max-w-[85%] break-words rounded-2xl px-4 py-2 text-left text-sm ' +
                            (m.role === 'user' ? 'bg-ember-500 text-ink-950' : 'bg-ink-800 text-fg')
                          }
                        >
                          {messageText(m)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {(status === 'submitted' || status === 'streaming') && (
                  <div className="mb-4 text-left">
                    <span
                      role="status"
                      aria-label={lang === 'es' ? 'La IA está escribiendo' : 'AI is typing'}
                      className="inline-flex items-center gap-1 rounded-2xl bg-ink-800 px-4 py-3"
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="typing-dot h-1.5 w-1.5 rounded-full bg-fg-muted"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  </div>
                )}

                {/* A 2x2 grid on phones instead of `flex-wrap`. Wrapping four chips of
                    unequal width produced a ragged 1/1/2 stack whose shape also changed
                    with the language; the grid gives the same tidy block for any label
                    length. From sm there is room for a natural chip row. */}
                {messages.length === 0 && (
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {[0, 1, 2, 3].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => send(t(`ai.chips.${i}`))}
                        className="rounded-full border border-ink-700 px-3 py-2 text-xs text-fg-muted transition-colors hover:border-ember-500/50 hover:text-fg sm:px-4 sm:text-sm"
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
                      <input name="name" required autoComplete="name" className={`${field} rounded-lg`} placeholder={t('ai.capture.name')} />
                      <input name="email" type="email" required autoComplete="email" className={`${field} rounded-lg`} placeholder={t('ai.capture.email')} />
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
                      // `min-w-0`: a text input carries an intrinsic width, and without
                      // this it refuses to shrink and pushes the row into an overflow.
                      className={`${field} min-w-0 rounded-full`}
                      placeholder={t('ai.inputPlaceholder')}
                      aria-label={t('ai.inputPlaceholder')}
                    />
                    {/* Icon-only below sm. A written "Enviar" costs 87px of a 327px row
                        and leaves the field cramped; the 48px circle gives that width
                        back to the input and is the shape a composer is expected to
                        have. The label returns from sm, where there is room for it. */}
                    <button
                      type="submit"
                      disabled={status !== 'ready'}
                      aria-label={t('ai.send')}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ember-500 font-semibold text-ink-950 transition-colors hover:bg-ember-400 disabled:opacity-60 sm:h-auto sm:w-auto sm:px-6 sm:py-3"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 sm:hidden"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                      <span className="hidden sm:inline">{t('ai.send')}</span>
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
