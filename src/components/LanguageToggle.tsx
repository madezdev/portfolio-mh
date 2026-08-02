import { useStore } from '@nanostores/react';
import { currentLanguage, setLanguage } from '../i18n/store';
import type { Language } from '../i18n/translations';

// Segmented control: both languages are always visible and the active one is
// highlighted, so the chip reads as state instead of as a hidden action.
const OPTIONS: ReadonlyArray<{ value: Language; code: string; name: string }> = [
  { value: 'es', code: 'ES', name: 'Español' },
  { value: 'en', code: 'EN', name: 'English' },
];

export default function LanguageToggle() {
  const lang = useStore(currentLanguage);

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
          <button
            key={option.value}
            type="button"
            lang={option.value}
            onClick={() => setLanguage(option.value)}
            aria-pressed={isActive}
            aria-label={option.name}
            className={`relative z-10 rounded-full px-3 py-1 font-mono text-xs font-semibold tracking-wide transition-colors duration-300 motion-reduce:transition-none ${
              isActive ? 'text-ink-950' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {option.code}
          </button>
        );
      })}
    </div>
  );
}
