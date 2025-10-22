// i18n configuration for Patrick Travel Services
// Supports English and French

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Always start with 'en' to avoid hydration mismatch
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Load saved language preference after initialization (client-side only)
if (typeof window !== 'undefined') {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage && savedLanguage !== i18n.language) {
    i18n.changeLanguage(savedLanguage);
  }
}

export default i18n;
