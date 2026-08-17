import { useEffect, useRef, useState } from 'react';
import type { Language } from '../i18n/translations';
import { useTranslations } from '../i18n/utils';
import { useReveal } from '../hooks/useReveal';
import { gsap, useGSAP } from '../lib/gsap';
import { cases, type Case } from '../data/cases';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * One case, stripped to type. No border box, no background, no image — the only
 * chrome is the hairline that separates it from the previous entry, so the track
 * reads as one continuous strip rather than as a row of cards.
 *
 * `cloned` marks the duplicate copy that makes the loop seamless: it is hidden
 * from assistive tech and pulled out of the tab order, so a screen reader hears
 * five cases and a keyboard user tabs through five links, not ten.
 */
function CaseEntry({ item, cloned, liveLabel, privateLabel }: {
  item: Case;
  cloned: boolean;
  liveLabel: string;
  privateLabel: string;
}) {
  // A private product has a URL but nothing a visitor can reach, so it must not
  // get the affordance — the click would land on a login form.
  const isLinked = Boolean(item.liveUrl) && item.access !== 'private';

  return (
    <article className="w-[17rem] shrink-0 border-l border-ink-800 px-7 sm:w-[20rem] sm:px-9">
      {item.tag && (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blueprint-300">{item.tag}</p>
      )}

      <h3 className="mt-4 font-display text-2xl font-semibold text-fg">{item.title}</h3>

      {/* Clamped so every entry occupies the same block and the strip keeps a
          steady baseline as it travels. */}
      <p className="mt-3 line-clamp-2 text-sm text-fg-muted">{item.summary}</p>

      {item.stack && item.stack.length > 0 && (
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-fg-muted/70">
          {item.stack.join(' · ')}
        </p>
      )}

      {/* Nothing is reserved when there is no action. The entries are flex children,
          so they already stretch to the tallest in the strip and the hairlines stay
          flush — a reserved slot would only leave dead air under every case that has
          neither a link nor a status. */}
      {item.access === 'private' ? (
        // Being deployed for a real client is the proof here; being reachable is
        // not. Say so rather than spend the entry's one click on a login form.
        <p className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-ember-500" aria-hidden="true" />
          {privateLabel}
        </p>
      ) : (
        isLinked &&
        item.liveUrl && (
          <a
            href={item.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={cloned ? -1 : undefined}
            aria-label={`${liveLabel}: ${item.client}`}
            className="group/link mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ember-500 transition-colors hover:text-ember-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-500"
          >
            {liveLabel}
            <span
              aria-hidden="true"
              className="transition-transform duration-300 ease-out motion-safe:group-hover/link:translate-x-0.5"
            >
              ↗
            </span>
          </a>
        )
      )}
    </article>
  );
}

/**
 * The cases section is a marquee: one continuous strip of entries travelling
 * sideways, stripped to type. There is no product screenshot anywhere on purpose
 * — a media-led grid has to fill every tile, and a placeholder tile reads as a
 * broken image rather than as a case.
 *
 * The strip stops the moment a pointer or the keyboard reaches it. Moving text is
 * unreadable and a moving link is unclickable, so the motion has to yield as soon
 * as someone actually wants the content.
 */
export default function StudioCases({ lang }: { lang: Language }) {
  const { t } = useTranslations(lang);
  useReveal('cases');

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // How many times the list is repeated across the track. Two is only enough while
  // one copy is at least as wide as the viewport: the strip travels exactly one
  // copy before it resets, so everything behind the first copy has to cover the
  // viewport on its own. With five short entries on a 1920px screen it does not,
  // and the tail of the cycle shows empty page. Hence: measure, then repeat.
  const [copyCount, setCopyCount] = useState(2);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      const copy = track.firstElementChild;
      if (!copy) return;
      const copyWidth = copy.getBoundingClientRect().width;
      if (copyWidth <= 0) return;
      const needed = Math.ceil(viewport.getBoundingClientRect().width / copyWidth) + 1;
      setCopyCount((prev) => (prev === needed ? prev : needed));
    };

    measure();
    // Entry widths change at the `sm` breakpoint, and so does the viewport, so the
    // count cannot be settled once at mount.
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // One copy is the whole cycle: travelling that far lands the next copy
        // exactly where this one started, so the loop restarts on an identical
        // frame and the seam never shows.
        const distance = track.scrollWidth / copyCount;
        if (distance <= 0) return;

        const tween = gsap.to(track, {
          x: -distance,
          // Constant speed rather than constant duration: adding a case makes the
          // strip longer, not faster, so the pace stays readable as data grows.
          duration: distance / 45,
          ease: 'none',
          repeat: -1,
        });
        tweenRef.current = tween;

        return () => {
          tweenRef.current = null;
          tween.kill();
        };
      });
    },
    // A new copy count changes both the track width and the cycle distance, so the
    // tween has to be rebuilt rather than left running against the old geometry.
    { dependencies: [copyCount], revertOnUpdate: true },
  );

  // Eased rather than snapped: a strip that halts dead reads as a broken
  // animation, and one that resumes instantly throws the eye off the entry.
  const setPaused = (paused: boolean) => {
    const tween = tweenRef.current;
    if (!tween) return;
    gsap.to(tween, { timeScale: paused ? 0 : 1, duration: 0.4, ease: 'power2.out', overwrite: true });
  };

  return (
    <Section id="cases" className="bg-ink-900/40">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300 mb-4">{t('cases.eyebrow')}</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-fg">{t('cases.title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('cases.subtitle')}</p>
      </Container>

      {cases.length === 0 ? (
        <Container>
          <p className="mt-14 text-fg-muted">{t('cases.emptyLabel')}</p>
        </Container>
      ) : (
        // Full-bleed on purpose: a marquee that stops at the container edge reads
        // as a scrollbox, not as a strip passing through the page.
        <div
          ref={viewportRef}
          className={cx(
            'reveal cases-marquee relative mt-14 overflow-hidden py-2',
            // With no animation the duplicate is dead weight and the strip has no
            // way to move, so it becomes a plain scrollable region instead.
            'motion-reduce:overflow-x-auto motion-reduce:snap-x',
          )}
          style={{
            // Fades the entries in and out at the edges so they enter the page
            // rather than being clipped by an invisible box.
            maskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div ref={trackRef} className="cases-track flex w-max">
            {Array.from({ length: copyCount }, (_, copy) => {
              const cloned = copy > 0;
              return (
                <div
                  key={copy}
                  className={cx('flex shrink-0', cloned && 'motion-reduce:hidden')}
                  aria-hidden={cloned || undefined}
                >
                  {cases.map((c) => (
                    <CaseEntry
                      key={c.id}
                      item={c}
                      cloned={cloned}
                      liveLabel={t('cases.liveLabel')}
                      privateLabel={t('cases.privateLabel')}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}
