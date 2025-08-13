import { atom } from 'nanostores';
import type { Language } from './translations';

// Get initial language from localStorage or default to Spanish
const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('portfolio-language');
    if (stored === 'en' || stored === 'es') {
      return stored;
    }
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('en') ? 'en' : 'es';
  }
  return 'es'; // Default to Spanish for SSR
};

export const currentLanguage = atom<Language>(getInitialLanguage());

// Save language preference to localStorage when it changes
currentLanguage.subscribe((lang) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('portfolio-language', lang);
    document.documentElement.lang = lang;
  }
});

export const toggleLanguage = () => {
  const current = currentLanguage.get();
  currentLanguage.set(current === 'es' ? 'en' : 'es');
};