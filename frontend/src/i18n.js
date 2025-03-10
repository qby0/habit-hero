import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translations
import translationEN from './locales/en/translation.json';
import translationUK from './locales/uk/translation.json';
import translationRU from './locales/ru/translation.json';
import translationSK from './locales/sk/translation.json';

// Resources for translations
const resources = {
  en: {
    translation: translationEN
  },
  uk: {
    translation: translationUK
  },
  ru: {
    translation: translationRU
  },
  sk: {
    translation: translationSK
  }
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Load translations from server (for future use)
  .use(Backend)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    
    react: {
      useSuspense: true
    }
  });

export default i18n; 