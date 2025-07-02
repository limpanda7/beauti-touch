// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES = {
  ko: 'ko',
  en: 'en',
  vi: 'vi',
  th: 'th',
  id: 'id',
  es: 'es',
  pt: 'pt'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// 브라우저 언어를 지원하는 언어로 매핑
export const getBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // 언어 코드에서 기본 언어만 추출 (예: 'ko-KR' -> 'ko')
  const primaryLang = browserLang.split('-')[0].toLowerCase();
  
  // 지원하는 언어인지 확인
  if (primaryLang in SUPPORTED_LANGUAGES) {
    return primaryLang as SupportedLanguage;
  }
  
  // 기본값은 영어
  return 'en';
};

// 언어 표시명 매핑
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  es: 'Español',
  pt: 'Português',
};

// localStorage 키
const LANGUAGE_STORAGE_KEY = 'beauti-touch-language';

// localStorage에 언어 저장
export const saveLanguageToStorage = (language: SupportedLanguage): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
};

// localStorage에서 언어 가져오기
export const getLanguageFromStorage = (): SupportedLanguage | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as SupportedLanguage;
    }
  }
  return null;
};

// 현재 언어 가져오기 (우선순위: i18n > localStorage > 브라우저 언어)
export const getCurrentLanguage = (): SupportedLanguage => {
  // 1. i18n이 초기화되어 있고 언어가 설정되어 있으면 사용
  if (typeof window !== 'undefined' && (window as any).i18n?.language) {
    const currentLang = (window as any).i18n.language as SupportedLanguage;
    if (currentLang in SUPPORTED_LANGUAGES) {
      return currentLang;
    }
  }
  
  // 2. localStorage에서 언어 가져오기
  const storedLanguage = getLanguageFromStorage();
  if (storedLanguage) {
    return storedLanguage;
  }
  
  // 3. 브라우저 언어 사용
  return getBrowserLanguage();
};

// 언어 설정 (i18n 변경 + localStorage 저장)
export const setLanguage = async (language: SupportedLanguage): Promise<void> => {
  if (typeof window !== 'undefined' && (window as any).i18n) {
    try {
      await (window as any).i18n.changeLanguage(language);
      saveLanguageToStorage(language);
    } catch (error) {
      console.error('언어 변경 실패:', error);
      // localStorage에는 저장
      saveLanguageToStorage(language);
    }
  }
};
