import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getBrowserLanguage, getLanguageFromStorage } from '../utils/languageUtils';

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
// 인도네시아어
import id from './locales/id.json';

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  vi: { translation: vi },
  th: { translation: th },
  pt: { translation: pt },
  es: { translation: es },
  id: { translation: id },
};

// 초기 언어 결정 (우선순위: localStorage > 브라우저 언어)
const getInitialLanguage = (): string => {
  const storedLanguage = getLanguageFromStorage();
  if (storedLanguage) {
    return storedLanguage;
  }
  return getBrowserLanguage();
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'navigator'],
      caches: [],
    },
  });

// 전역 객체에 i18n 인스턴스 저장 (타입 안전성을 위해)
if (typeof window !== 'undefined') {
  (window as any).i18n = i18n;
}

export default i18n; 