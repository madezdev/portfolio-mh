import { useStore } from '@nanostores/react';
import { currentLanguage, toggleLanguage } from '../i18n/store';

export default function LanguageToggle() {
  const lang = useStore(currentLanguage);

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800/60 px-3 py-2 transition-colors duration-300 hover:border-ember-500/50 group"
      aria-label={`Switch to ${lang === 'es' ? 'English' : 'Spanish'}`}
    >
      <span className="text-base transition-transform group-hover:scale-110">
        {lang === 'es' ? '🇺🇸' : '🇪🇸'}
      </span>
      <span className="font-mono text-xs font-medium tracking-wide text-fg-muted transition-colors group-hover:text-fg">
        {lang === 'es' ? 'EN' : 'ES'}
      </span>
    </button>
  );
}