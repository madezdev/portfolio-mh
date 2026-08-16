import { atom } from 'nanostores';
import type { Language } from './translations';

// The site is Spanish-first: server and client both render 'es' so there is
// never a hydration mismatch. English is opt-in via the toggle (persisted).
export const currentLanguage = atom<Language>('es');

// Persist + reflect on <html lang> when the language CHANGES (listen, not
// subscribe, so the initial 'es' never overwrites a stored preference).
currentLanguage.listen((lang) => {
  if (typeof window === 'undefined') return;
  if (typeof window.localStorage !== 'undefined') {
    localStorage.setItem('portfolio-language', lang);
  }
  document.documentElement.lang = lang;
});

export const setLanguage = (lang: Language) => {
  currentLanguage.set(lang);
};
