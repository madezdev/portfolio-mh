import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { Language } from '../i18n/translations';
import { useTranslations } from '../i18n/utils';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';
import { SUBMIT_LEAD_TOOL_PART } from '../lib/ai-tools';

// Guarded the same way as `leadSent` below: `parts` is typed as required on
// `UIMessage`, but is defensively treated as possibly absent at runtime
// throughout this codebase (see `transcriptOf` in `src/server/ai/tools.ts`).
// This runs for every rendered message, so an unguarded access here was the
// riskier of the two identical assumptions.
function messageText(m: { parts?: Array<{ type: string; text?: string }> }): string {
  return (m.parts ?? []).filter((p) => p.type === 'text').map((p) => p.text ?? '').join('');
}

export default function StudioAI({ lang }: { lang: Language }) {
  const { t } = useTranslations(lang);
  const { messages, sendMessage, status, error, clearError, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const [input, setInput] = useState('');

  // A successful submitLead in the history is the only source of truth for this.
  // The previous flag pair (`showCapture && captured`) was a contradiction and the
  // success line could never render. Defensive about missing `parts`/`output`
  // because a rejected tool call arrives as `state: 'output-error'` with no `output`.
  const leadSent = messages.some((m) =>
    m.parts?.some(
      (p: any) => p.type === SUBMIT_LEAD_TOOL_PART && p.state === 'output-available' && p.output?.sent,
    ),
  );

  // Keep the newest message and streaming tokens in view as they arrive.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  // Only a turn actually in flight should lock the composer. Gating on
  // `status !== 'ready'` also caught `error`, so after one failure the field went
  // dead and the visitor had no way to say anything again — the other half of the
  // lock, and the half that is invisible because the input still looks normal.
  const busy = status === 'submitted' || status === 'streaming';

  function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    // A failed turn leaves the hook in `error`, which blocks the next send until it
    // is cleared. Without this the composer looks live but silently does nothing.
    if (error) clearError();
    sendMessage({ text: value });
    setInput('');
  }

  // Re-runs the last user turn rather than asking the visitor to retype it. The
  // usual failure here is a throttled burst, so the message itself was fine.
  function retry() {
    clearError();
    regenerate();
  }

  // Radius is left to the call site (the composer input adds `rounded-full`) rather
  // than baked in here, since it would depend on Tailwind's output order rather than
  // the order of the class string, which is not a guarantee.
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
              {/* `overscroll-contain` stops a flick inside the transcript from
                    chaining to the page once it hits either end — on a phone the panel
                    is most of the screen, so that hand-off is easy to trigger and
                    throws the reader out of the conversation.

                    `subtle-scrollbar` (see global.css) replaces the native bar, which
                    macOS paints as an opaque white rectangle inside this near-black
                    rounded panel. `pr-2` is part of the same fix: without it the
                    bubbles run flush into the bar with no gutter. */}
                {messages.length > 0 && (
                  <div
                    ref={scrollRef}
                    className="subtle-scrollbar mb-4 max-h-80 space-y-4 overflow-y-auto overscroll-contain pr-2"
                  >
                    {messages.map((m) => {
                      // An assistant message carrying only tool parts (updateIntake,
                      // submitLead) has no text, and there is nothing to show for it —
                      // the confirmation line below already renders from the
                      // submitLead result. Skipping the whole row, not just the span,
                      // keeps `space-y-4` from opening a blank gap for it.
                      const text = messageText(m);
                      if (!text) return null;
                      return (
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
                            {text}
                          </span>
                        </div>
                      );
                    })}
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

                {/* An inline notice, not a takeover. Replacing the whole panel on the
                    first failure discarded the conversation and left no way back —
                    nothing ever reset the status, so one throttled burst ended the
                    session. The transcript and the composer stay; this sits between
                    them and clears itself as soon as a turn succeeds. */}
                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-xl border border-ink-700 bg-ink-900/60 p-4 text-sm"
                  >
                    <p className="text-fg-muted">
                      {error.message.includes('ai_busy') ? t('ai.busy') : t('ai.fallback.text')}
                    </p>
                    {/* Both actions carry `min-h-11` so they clear the 44px touch
                        minimum. Padding alone left the retry button at 34px — the
                        recovery control being the hardest thing to hit is exactly
                        backwards on the screen where it matters most. */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-5">
                      <button
                        type="button"
                        onClick={retry}
                        className="inline-flex min-h-11 items-center rounded-full border border-ember-500/60 px-4 font-semibold text-ember-500 transition-colors hover:border-ember-400 hover:text-ember-400"
                      >
                        {t('ai.retry')}
                      </button>
                      {/* Kept as the way out for someone who does not want to wait. */}
                      <a
                        href="#contact"
                        className="inline-flex min-h-11 items-center font-semibold text-fg-muted transition-colors hover:text-fg"
                      >
                        {t('ai.fallback.cta')} →
                      </a>
                    </div>
                  </div>
                )}

                {leadSent && (
                  <p className="mb-4 text-sm text-ember-400">{t('ai.capture.success')}</p>
                )}

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
                    disabled={busy}
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
                    disabled={busy}
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
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-fg-muted/60">{t('ai.disclosure')}</p>
        </div>
      </Container>
    </Section>
  );
}
