import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import type { ChartType } from '../types';
import { getDefaultCurrencyForLanguage } from '../utils/currency';
import { getBrowserLanguage } from '../utils/languageUtils';

export interface Settings {
  language: string;
  currency: string;
  businessType: ChartType;
}

interface SettingsStore extends Settings {
  isLoading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
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
        const settingsRef = doc(db, 'users', userId, 'settings', 'userSettings');
        
        // 실시간 리스너 설정
        const unsubscribe = onSnapshot(settingsRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data() as Settings;
            set({
              language: data.language || defaultSettings.language,
              currency: data.currency || defaultSettings.currency,
              businessType: data.businessType || defaultSettings.businessType,
              isLoading: false
            });
            console.log('사용자 설정 로드 완료:', data);
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
    
    updateSettings: async (newSettings: Partial<Settings>) => {
      const { user } = await import('../stores/authStore').then(m => m.useAuthStore.getState());
      
      if (!user?.uid) {
        console.error('사용자가 로그인되지 않았습니다.');
        return;
      }
      
      set({ isLoading: true });
      
      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
        const currentSettings = get();
        
        // 언어가 변경되는 경우 해당 언어의 기본 통화로 자동 설정
        let updatedSettings = {
          ...currentSettings,
          ...newSettings
        };
        
        if (newSettings.language && newSettings.language !== currentSettings.language) {
          const defaultCurrency = getDefaultCurrencyForLanguage(newSettings.language);
          updatedSettings.currency = defaultCurrency;
          console.log(`언어 변경: ${newSettings.language}, 기본 통화 설정: ${defaultCurrency}`);
        }
        
        // Settings 필드만 저장
        const settingsToSave = pickSettingsOnly(updatedSettings);
        await setDoc(settingsRef, settingsToSave);
        set({ isLoading: false });
      } catch (error) {
        console.error('설정 업데이트 실패:', error);
        set({ isLoading: false });
        throw error;
      }
    },
    
    resetSettings: async () => {
      const { user } = await import('../stores/authStore').then(m => m.useAuthStore.getState());
      
      if (!user?.uid) {
        console.error('사용자가 로그인되지 않았습니다.');
        return;
      }
      
      set({ isLoading: true });
      
      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
        await setDoc(settingsRef, defaultSettings);
        set({ isLoading: false });
      } catch (error) {
        console.error('설정 초기화 실패:', error);
        set({ isLoading: false });
        throw error;
      }
    }
  }))
); 