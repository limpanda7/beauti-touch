import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { User, LoginCredentials, SignUpCredentials } from '../types';
import * as authService from '../services/auth';
import { isWebViewEnvironment } from '../services/webviewBridge';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  isInitialized: boolean;
}

interface AuthActions {
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null, errorCode?: string | null) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// 웹뷰 환경에서 사용자 정보를 로컬 스토리지에 저장
const saveUserToStorage = (user: User | null) => {
  if (isWebViewEnvironment()) {
    try {
      if (user) {
        localStorage.setItem('beauti-touch-user', JSON.stringify(user));
        console.log('웹뷰: 사용자 정보를 로컬 스토리지에 저장');
      } else {
        localStorage.removeItem('beauti-touch-user');
        console.log('웹뷰: 사용자 정보를 로컬 스토리지에서 제거');
      }
    } catch (error) {
      console.error('웹뷰: 로컬 스토리지 저장 실패:', error);
    }
  }
};

// 웹뷰 환경에서 로컬 스토리지에서 사용자 정보 복원
const loadUserFromStorage = (): User | null => {
  if (isWebViewEnvironment()) {
    try {
      const storedUser = localStorage.getItem('beauti-touch-user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        console.log('웹뷰: 로컬 스토리지에서 사용자 정보 복원');
        return user;
      }
    } catch (error) {
      console.error('웹뷰: 로컬 스토리지에서 사용자 정보 복원 실패:', error);
    }
  }
  return null;
};

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    user: null,
    isLoading: false,
    error: null,
    errorCode: null,
    isInitialized: false,

    // Actions
    signUp: async (credentials: SignUpCredentials) => {
      set({ isLoading: true, error: null, errorCode: null });
      try {
        const user = await authService.signUp(credentials);
        set({ user, isLoading: false });
        saveUserToStorage(user);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.';
        set({ error: errorMessage, errorCode: errorMessage, isLoading: false });
        throw error;
      }
    },

    signIn: async (credentials: LoginCredentials) => {
      set({ isLoading: true, error: null, errorCode: null });
      try {
        const user = await authService.signIn(credentials);
        console.log('AuthStore - 로그인 성공, 사용자 설정:', user);
        set({ user, isLoading: false, isInitialized: true });
        saveUserToStorage(user);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.';
        console.error('AuthStore - 로그인 실패:', errorMessage);
        set({ error: errorMessage, errorCode: errorMessage, isLoading: false });
        throw error;
      }
    },

    signInWithGoogle: async () => {
      set({ isLoading: true, error: null, errorCode: null });
      try {
        // AuthService에서 환경 분기 처리
        const user = await authService.signInWithGoogle();
        console.log('AuthStore - Google 로그인 성공, 사용자 설정:', user);
        set({ user, isLoading: false, isInitialized: true });
        saveUserToStorage(user);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Google 로그인 중 오류가 발생했습니다.';
        console.error('AuthStore - Google 로그인 실패:', errorMessage);
        set({ error: errorMessage, errorCode: errorMessage, isLoading: false });
        throw error;
      }
    },

    signOut: async () => {
      set({ isLoading: true, error: null, errorCode: null });
      try {
        // AuthService에서 환경 분기 처리
        await authService.signOutUser();
        set({ user: null, isLoading: false });
        saveUserToStorage(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.';
        set({ error: errorMessage, errorCode: errorMessage, isLoading: false });
        throw error;
      }
    },

    setUser: (user: User | null) => {
      set({ user });
      saveUserToStorage(user);
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null, errorCode?: string | null) => {
      set({ error, errorCode: errorCode || null });
    },

    clearError: () => {
      set({ error: null, errorCode: null });
    },

    initialize: async () => {
      set({ isLoading: true });
      
      // 웹뷰 환경에서 로컬 스토리지에서 사용자 정보 복원 시도
      if (isWebViewEnvironment()) {
        const storedUser = loadUserFromStorage();
        if (storedUser) {
          console.log('웹뷰: 로컬 스토리지에서 사용자 정보 복원됨, 임시로 설정');
          set({ user: storedUser, isLoading: false, isInitialized: true });
        }
      }
      
      // Firebase Auth 상태 변경 감지
      const unsubscribe = authService.onAuthStateChange((user) => {
        console.log('Firebase Auth 상태 변경:', user ? '로그인됨' : '로그아웃됨');
        set({ user, isLoading: false, isInitialized: true });
        saveUserToStorage(user);
      });

      // 초기화 완료를 기다림
      return new Promise<void>((resolve) => {
        // 약간의 지연 후 resolve (인증 상태 확인 시간 확보)
        setTimeout(() => {
          resolve();
        }, 100);
      });
    },
  }))
);

// 인증 상태 선택자들
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsInitialized = () => useAuthStore((state) => state.isInitialized); 