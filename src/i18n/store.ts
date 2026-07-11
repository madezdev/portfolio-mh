import { atom } from 'nanostores';
import type { Language } from './translations';

// The store starts at the SSR default ('es') so the server render and the first
// client render match (no hydration mismatch). After hydration, useLanguageSync
// switches it to the visitor's real preference.
export const currentLanguage = atom<Language>('es');

/** Resolve the visitor's language on the client: stored preference → browser. */
export function resolveClientLanguage(): Language {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return 'es';
  const stored = localStorage.getItem('portfolio-language');
  if (stored === 'en' || stored === 'es') return stored;
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es';
}

// Persist + reflect on <html lang> when the language CHANGES (listen, not
// subscribe, so the initial 'es' never overwrites a stored preference).
currentLanguage.listen((lang) => {
  if (typeof window === 'undefined') return;
  if (typeof window.localStorage !== 'undefined') {
    localStorage.setItem('portfolio-language', lang);
  }
  document.documentElement.lang = lang;
});

export const toggleLanguage = () => {
  currentLanguage.set(currentLanguage.get() === 'es' ? 'en' : 'es');
};
