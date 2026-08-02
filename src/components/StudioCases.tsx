import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
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
 * Branded tile for cases with no screenshot yet. It has to read as a composed,
 * lit surface next to a real screenshot — hence the ember wash: the monogram
 * alone on flat ink is near-invisible and reads as a broken image.
 */
function FallbackTile({ item }: { item: Case }) {
  return (
    <div className="relative h-full w-full bg-ink-900" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(107,138,255,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(107,138,255,0.10) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(90% 70% at 15% 100%, rgba(255,106,26,0.11), transparent 60%)' }}
      />
      <span className="case-media absolute inset-0 flex items-center justify-center font-display text-8xl font-bold text-fg/15 select-none">
        {item.client.charAt(0)}
      </span>
    </div>
  );
}

/**
 * The product window: a static frame that clips, a zoom layer for hover, and the
 * screenshot itself. Three separate elements on purpose. GSAP takes exclusive
 * ownership of the elements it animates by writing `translate: none; rotate: none;
 * scale: none` inline and folding everything into its own `transform` matrix — so on
 * `.case-media` every Tailwind translate/scale utility is dead, hover variants
 * included (`scale-110` survives only because GSAP absorbed it into the matrix).
 * The hover zoom therefore has to sit one level up, on an element GSAP never touches.
 */
function CaseVisual({ item, featured }: { item: Case; featured: boolean }) {
  return (
    <div
      className={cx(
        'relative w-full flex-1 overflow-hidden rounded-xl border border-ink-800 bg-ink-900',
        // No fixed aspect ratio on purpose. The media is the flex child that absorbs
        // whatever height the grid row hands the card, so every card in a row ends
        // level and the slack shows up as more screenshot instead of as dead space.
        // `min-h` is the floor that keeps it from collapsing.
        'min-h-[13.5rem]',
        // On lg the lead card turns horizontal, so the media stops being a row of
        // its own and becomes a full-height column beside the copy.
        featured && 'md:min-h-[16rem] lg:min-h-0 lg:w-1/2 lg:flex-none',
      )}
    >
      <div className="h-full w-full transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]">
        {item.image ? (
          <img
            src={item.image}
            alt={`${item.client} — ${item.summary}`}
            width={item.imageWidth}
            height={item.imageHeight}
            loading="lazy"
            decoding="async"
            // `object-top` keeps the product's own header in frame; a centered crop
            // reduces a UI screenshot to a meaningless middle band at this size.
            // `scale-105` is the overscan that hides the parallax drift below. Keep
            // the two in step: the overscan has to cover the drift, and every extra
            // percent is content eaten off all four edges of a curated crop.
            className="case-media h-full w-full scale-105 object-cover object-top"
          />
        ) : (
          <FallbackTile item={item} />
        )}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: 'linear-gradient(to bottom, rgba(255,138,61,0.07), transparent)' }}
        aria-hidden="true"
      />
    </div>
  );
}

export default function StudioCases() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  useReveal('cases');

  // Depth: each case visual drifts against its card as it scrolls through view.
  // The drift is deliberately small — it must stay inside the `scale-105` overscan
  // on the media, and every percent of overscan crops a curated screenshot.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('#cases .case-media').forEach((media) => {
        gsap.fromTo(
          media,
          { yPercent: -3 },
          {
            yPercent: 3,
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
          // Cards stretch to their row (the grid default). That is only safe because
          // the media, not the copy, is the part that grows — see CaseVisual.
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c, index) => {
              // The lead case spans two columns from md up, so the five cards always
              // total six slots — 3+3 on lg, 2+2+2 on md — and no orphan cell is
              // left over at either breakpoint.
              const featured = index === 0;
              // A private product has a URL but nothing a visitor can reach, so it
              // must not get the affordance — the click would land on a login form.
              const isLinked = Boolean(c.liveUrl) && c.access !== 'private';

              return (
                // `reveal` stays on the <article>, and nothing else does: useReveal
                // hands it to GSAP, which pins `translate/rotate/scale: none` inline.
                // A hover lift here would be silently dead — it goes on the wrapper.
                <article key={c.id} className={cx('reveal', featured && 'md:col-span-2')}>
                  <div
                    className={cx(
                      'group relative flex h-full flex-col rounded-2xl border border-ink-800 bg-ink-950 p-3',
                      'transition duration-300 ease-out',
                      // Lead card goes side-by-side once it is two columns wide: a
                      // stacked media that wide towers over its single-column
                      // neighbour no matter which aspect ratio it is given.
                      featured && 'lg:flex-row',
                      // Colour and glow always respond; only the movement is gated,
                      // matching how the rest of the site treats reduced motion.
                      isLinked &&
                        'hover:border-ember-500/40 hover:shadow-[0_20px_45px_-25px_rgba(255,106,26,0.5)] focus-within:border-ember-500/40 motion-safe:hover:-translate-y-1 motion-safe:focus-within:-translate-y-1',
                    )}
                  >
                    <CaseVisual item={c} featured={featured} />

                    <div
                      className={cx(
                        'flex flex-col px-3 pb-3 pt-6',
                        featured && 'lg:flex-1 lg:justify-center lg:py-3 lg:pl-8 lg:pr-2',
                      )}
                    >
                      {/* Both labels stay on one line and the rule between them takes
                          the squeeze — in the narrow copy column of the lead card,
                          a wrapping label breaks mid-phrase and looks like a bug. */}
                      <div className="flex items-center gap-3">
                        <p className="whitespace-nowrap font-mono text-xs uppercase tracking-widest text-ember-400">
                          {c.client}
                        </p>
                        {c.tag && (
                          <>
                            <span className="h-px min-w-2 flex-1 bg-ink-800" aria-hidden="true" />
                            <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-blueprint-300">
                              {c.tag}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className={cx('mt-3 font-display font-semibold text-fg', featured ? 'text-2xl' : 'text-xl')}>
                        {c.title}
                      </h3>
                      {/* Two lines reserved so a one-line summary and a two-line one
                          give their cards the same copy block, and the medias above
                          them settle at the same height. */}
                      <p className="mt-2 min-h-[2.5rem] text-sm text-fg-muted">{c.summary}</p>

                      {c.stack && c.stack.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {c.stack.map((tech) => (
                            <li
                              key={tech}
                              className="rounded border border-ink-800 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-fg-muted"
                            >
                              {tech}
                            </li>
                          ))}
                        </ul>
                      )}

                      {c.testimonial && (
                        <blockquote className="mt-4 border-l-2 border-ember-500 pl-4 text-sm italic text-fg-muted">
                          "{c.testimonial.quote}"
                          <footer className="mt-1 not-italic text-xs text-fg-muted/80">
                            — {c.testimonial.author}, {c.testimonial.role}
                          </footer>
                        </blockquote>
                      )}

                      {c.access === 'private' && (
                        // Being deployed for a real client is the proof here; being
                        // reachable is not. Say so rather than spend the card's one
                        // click on a credentials form.
                        <p className="mt-5 inline-flex items-center gap-2 self-start font-mono text-[10px] uppercase tracking-[0.15em] text-fg-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-ember-500" aria-hidden="true" />
                          {t('cases.privateLabel')}
                        </p>
                      )}

                      {isLinked && c.liveUrl && (
                        // Stretched link: one focus target, semantic markup, and the
                        // whole card is clickable via the ::after overlay.
                        <a
                          href={c.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${t('cases.liveLabel')}: ${c.client}`}
                          className="inline-flex items-center gap-1 self-start pt-5 text-sm font-semibold text-ember-500 transition-colors hover:text-ember-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                        >
                          {t('cases.liveLabel')}
                          <span
                            aria-hidden="true"
                            className="transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-0.5"
                          >
                            ↗
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
}
