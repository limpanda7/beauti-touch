import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getBrowserLanguage, getLanguageFromStorage, saveLanguageToStorage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../utils/languageUtils';
import i18n from '../i18n';

interface LanguageStore {
  currentLanguage: string;
  isLoading: boolean;
  initializeLanguage: () => void;
  setLanguage: (language: string) => void;
  updateLanguageFromSettings: (settingsLanguage: string) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  subscribeWithSelector((set, get) => ({
    currentLanguage: 'ko',
    isLoading: false,
    
    // 앱 시작 시 언어 초기화 (로그인 전/후 모두 처리)
    initializeLanguage: () => {
      set({ isLoading: true });
      
      try {
        // 1. localStorage에서 저장된 언어 확인 (가장 우선)
        const storedLanguage = getLanguageFromStorage();
        if (storedLanguage) {
          // i18n 인스턴스와 동기화
          if (i18n.language !== storedLanguage) {
            i18n.changeLanguage(storedLanguage);
          }
          set({ currentLanguage: storedLanguage, isLoading: false });
          console.log('localStorage에서 언어 복원:', storedLanguage);
          return;
        }
        
        // 2. localStorage에 없으면 브라우저 언어 사용
        const browserLang = getBrowserLanguage();
        if (i18n.language !== browserLang) {
          i18n.changeLanguage(browserLang);
          saveLanguageToStorage(browserLang);
        }
        set({ currentLanguage: browserLang, isLoading: false });
        console.log('브라우저 언어로 설정:', browserLang);
        
      } catch (error) {
        console.error('언어 초기화 실패:', error);
        // 에러 발생 시 i18n 인스턴스의 현재 언어 사용
        const fallbackLang = i18n.language || 'ko';
        set({ currentLanguage: fallbackLang, isLoading: false });
        console.log('에러 발생으로 fallback 언어 사용:', fallbackLang);
      }
    },
    
    // 언어 직접 설정 (사용자가 명시적으로 변경할 때)
    setLanguage: (language: string) => {
      if (language in SUPPORTED_LANGUAGES) {
        i18n.changeLanguage(language);
        saveLanguageToStorage(language as SupportedLanguage);
        set({ currentLanguage: language });
        console.log('언어 변경됨:', language);
      } else {
        console.warn(`지원하지 않는 언어: ${language}`);
      }
    },
    
    // 설정 스토어에서 언어 설정이 업데이트될 때 호출
    updateLanguageFromSettings: (settingsLanguage: string) => {
      if (settingsLanguage && settingsLanguage !== get().currentLanguage) {
        i18n.changeLanguage(settingsLanguage);
        saveLanguageToStorage(settingsLanguage as SupportedLanguage);
        set({ currentLanguage: settingsLanguage });
        console.log('설정에서 언어 업데이트됨:', settingsLanguage);
      }
    }
  }))
);
