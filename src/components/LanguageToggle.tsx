import { useStore } from '@nanostores/react';
import { currentLanguage, toggleLanguage } from '../i18n/store';

export default function LanguageToggle() {
  const lang = useStore(currentLanguage);

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all duration-300 group"
      aria-label={`Switch to ${lang === 'es' ? 'English' : 'Spanish'}`}
    >
      <span className="text-lg group-hover:scale-110 transition-transform">
        {lang === 'es' ? '🇺🇸' : '🇪🇸'}
      </span>
      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
        {lang === 'es' ? 'EN' : 'ES'}
      </span>
    </button>
  );
}