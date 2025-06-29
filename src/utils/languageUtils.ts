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
