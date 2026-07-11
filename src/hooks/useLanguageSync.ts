import { useEffect } from 'react';
import { currentLanguage, resolveClientLanguage } from '../i18n/store';

/**
 * After hydration, switch the language store to the visitor's real preference
 * (stored/browser). Runs once. Keeping this out of the initial render is what
 * avoids the SSR/client hydration mismatch — server and first client render
 * both use the default, then this reconciles to the real language.
 */
export function useLanguageSync() {
  useEffect(() => {
    const lang = resolveClientLanguage();
    if (currentLanguage.get() !== lang) currentLanguage.set(lang);
  }, []);
}
