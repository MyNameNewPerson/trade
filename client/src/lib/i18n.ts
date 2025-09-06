import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '@/locales/en.json';
import ruTranslations from '@/locales/ru.json';
import roTranslations from '@/locales/ro.json';

const resources = {
  en: { translation: enTranslations },
  ru: { translation: ruTranslations },
  ro: { translation: roTranslations },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
