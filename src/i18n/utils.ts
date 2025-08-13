import { translations, type Language } from './translations';
import { currentLanguage } from './store';

// Helper function to get translation
export function t(key: string, lang?: Language): string {
  const language = lang || currentLanguage.get();
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

// Hook for components to get translations
export function useTranslations(lang?: Language) {
  const language = lang || currentLanguage.get();
  
  return {
    t: (key: string) => t(key, language),
    lang: language
  };
}