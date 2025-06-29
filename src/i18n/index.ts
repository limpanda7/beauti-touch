import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getBrowserLanguage } from '../utils/languageUtils';

// 한국어
import ko from './locales/ko.json';
// 영어
import en from './locales/en.json';
// 베트남어
import vi from './locales/vi.json';
// 태국어
import th from './locales/th.json';
// 포르투갈어
import pt from './locales/pt.json';
// 스페인어
import es from './locales/es.json';

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  vi: { translation: vi },
  th: { translation: th },
  pt: { translation: pt },
  es: { translation: es },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n; 