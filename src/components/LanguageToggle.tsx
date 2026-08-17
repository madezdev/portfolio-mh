import type { Language } from '../i18n/translations';
import { LOCALE_PATH } from '../i18n/seo';

// Segmented control: both languages are always visible and the active one is
// highlighted, so the chip reads as state instead of as a hidden action.
// The options are anchors, not buttons: language lives in the URL, and these
// links are how a crawler discovers the other locale.
const OPTIONS: ReadonlyArray<{ value: Language; code: string; name: string }> = [
  { value: 'es', code: 'ES', name: 'Español' },
  { value: 'en', code: 'EN', name: 'English' },
];

export default function LanguageToggle({ lang }: { lang: Language }) {
  return (
    <div
      role="group"
      aria-label={lang === 'es' ? 'Idioma' : 'Language'}
      className="relative grid grid-cols-2 rounded-full border border-ink-700 bg-ink-800/60 p-1"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-ember-500 transition-transform duration-300 ease-out motion-reduce:transition-none ${
          lang === 'en' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />
      {OPTIONS.map((option) => {
        const isActive = lang === option.value;
        return (
          <a
            key={option.value}
            href={LOCALE_PATH[option.value]}
            hrefLang={option.value}
            lang={option.value}
            aria-current={isActive ? 'page' : undefined}
            aria-label={option.name}
            className={`relative z-10 rounded-full px-3 py-1 text-center font-mono text-xs font-semibold tracking-wide transition-colors duration-300 motion-reduce:transition-none ${
              isActive ? 'text-ink-950' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {option.code}
          </a>
        );
      })}
    </div>
  );
}
