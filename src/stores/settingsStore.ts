import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { ChartType } from '../types';
import { getDefaultCurrencyForLanguage } from '../utils/currency';
import { getBrowserLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../utils/languageUtils';
import type { User } from '../types';

export interface Settings {
  language: string;
  currency: string;
  businessType: ChartType;
}

interface SettingsStore extends Settings {
  isLoading: boolean;
  updateSettings: (newSettings: Partial<Settings>, user: User) => Promise<void>;
  resetSettings: (user: User) => Promise<void>;
  initializeSettings: (userId: string) => Promise<Unsubscribe | undefined>;
}

const defaultSettings: Settings = {
  language: 'ko',
  currency: 'KRW',
  businessType: ''
};

// 브라우저 언어에 따른 기본 설정 생성
const getDefaultSettings = (): Settings => {
  const browserLanguage = getBrowserLanguage();
  const defaultCurrency = getDefaultCurrencyForLanguage(browserLanguage);
  
  return {
    language: browserLanguage,
    currency: defaultCurrency,
    businessType: ''
  };
};

// Settings 필드만 추출하는 유틸 함수
function pickSettingsOnly(obj: any): Settings {
  return {
    language: obj.language,
    currency: obj.currency,
    businessType: obj.businessType,
  };
}

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector((set, get) => ({
    ...defaultSettings,
    isLoading: false,
    
    initializeSettings: async (userId: string): Promise<Unsubscribe | undefined> => {
      if (!userId) return;
      
      set({ isLoading: true });
      
      try {
        const userRef = doc(db, 'users', userId);
        
        // 실시간 리스너 설정
        const unsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            const settings = userData.settings || {};
            set({
              language: settings.language || defaultSettings.language,
              currency: settings.currency || defaultSettings.currency,
              businessType: settings.businessType || defaultSettings.businessType,
              isLoading: false
            });
            console.log('사용자 설정 로드 완료:', settings);
          } else {
            // 설정이 없으면 브라우저 언어에 따른 기본값으로 초기화
            const dynamicDefaults = getDefaultSettings();
            set({ ...dynamicDefaults, isLoading: false });
            console.log('사용자 설정 없음, 기본값으로 초기화:', dynamicDefaults);
          }
        }, (error) => {
          console.error('설정 로드 실패:', error);
          const dynamicDefaults = getDefaultSettings();
          set({ ...dynamicDefaults, isLoading: false });
        });
        
        // 컴포넌트 언마운트 시 리스너 정리를 위해 반환
        return unsubscribe;
      } catch (error) {
        console.error('설정 초기화 실패:', error);
        set({ ...defaultSettings, isLoading: false });
        return undefined;
      }
    },
    
    updateSettings: async (newSettings: Partial<Settings>, user: User) => {
      console.log('updateSettings 호출:', { newSettings, user, uid: user?.uid });
      
      if (!user?.uid) {
        console.error('사용자가 로그인되지 않았습니다.');
        throw new Error('사용자가 로그인되지 않았습니다.');
      }
      
      if (typeof user.uid !== 'string' || user.uid.trim() === '') {
        console.error('유효하지 않은 uid:', user.uid);
        throw new Error('유효하지 않은 사용자 ID입니다.');
      }
      
      set({ isLoading: true });
      
      try {
        console.log('Firestore 경로 생성:', ['users', user.uid]);
        const userRef = doc(db, 'users', user.uid);
        const currentSettings = get();
        
        // 언어가 변경되는 경우 해당 언어의 기본 통화로 자동 설정
        let updatedSettings = {
          ...currentSettings,
          ...newSettings
        };
        
        if (newSettings.language && newSettings.language !== currentSettings.language) {
          // 지원하는 언어인지 확인
          if (newSettings.language in SUPPORTED_LANGUAGES) {
            const defaultCurrency = getDefaultCurrencyForLanguage(newSettings.language as SupportedLanguage);
            updatedSettings.currency = defaultCurrency;
            console.log(`언어 변경: ${newSettings.language}, 기본 통화 설정: ${defaultCurrency}`);
          } else {
            console.warn(`지원하지 않는 언어: ${newSettings.language}`);
          }
        }
        
        // Settings 필드만 저장
        const settingsToSave = pickSettingsOnly(updatedSettings);
        console.log('설정 저장 시도:', { uid: user.uid, settingsToSave });
        await setDoc(userRef, { settings: settingsToSave }, { merge: true });
        console.log('설정 저장 성공');
        set({ isLoading: false });
      } catch (error) {
        console.error('설정 업데이트 실패:', error);
        set({ isLoading: false });
        throw error;
      }
    },
    
    resetSettings: async (user: User) => {
      if (!user?.uid) {
        console.error('사용자가 로그인되지 않았습니다.');
        return;
      }
      
      set({ isLoading: true });
      
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { settings: defaultSettings }, { merge: true });
        set({ isLoading: false });
      } catch (error) {
        console.error('설정 초기화 실패:', error);
        set({ isLoading: false });
        throw error;
      }
    }
  }))
); 