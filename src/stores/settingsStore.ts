import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChartType } from '../types';

export interface Settings {
  language: string;
  currency: string;
  businessType: ChartType;
}

interface SettingsStore extends Settings {
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  language: 'ko',
  currency: 'KRW',
  businessType: ''
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      updateSettings: (newSettings: Partial<Settings>) => {
        set((state) => ({
          ...state,
          ...newSettings
        }));
      },
      
      resetSettings: () => {
        set(defaultSettings);
      }
    }),
    {
      name: 'beauti-touch-settings',
      version: 1,
    }
  )
); 