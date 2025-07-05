import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { User, LoginCredentials, SignUpCredentials } from '../types';
import * as authService from '../services/auth';
import { setWebViewMessageListener, removeWebViewMessageListener } from '../services/webviewBridge';

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
        const user = await authService.signInWithGoogle();
        console.log('AuthStore - Google 로그인 성공, 사용자 설정:', user);
        set({ user, isLoading: false, isInitialized: true });
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
        await authService.signOutUser();
        set({ user: null, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.';
        set({ error: errorMessage, errorCode: errorMessage, isLoading: false });
        throw error;
      }
    },

    setUser: (user: User | null) => {
      set({ user });
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
      
      // 인증 상태 변경 감지
      const unsubscribe = authService.onAuthStateChange((user) => {
        set({ user, isLoading: false, isInitialized: true });
      });

      // 웹뷰 메시지 리스너 설정
      setWebViewMessageListener((message) => {
        console.log('AuthStore에서 웹뷰 메시지 수신:', message);
        
        switch (message.type) {
          case 'firebaseAuthStateChanged':
            if (message.value?.isSignedIn && message.value?.user) {
              // 네이티브 앱에서 로그인된 사용자 정보를 웹 Firebase에 동기화
              console.log('네이티브 앱에서 로그인 상태 변경 감지:', message.value.user);
            } else {
              // 네이티브 앱에서 로그아웃된 경우 웹 Firebase에서도 로그아웃
              console.log('네이티브 앱에서 로그아웃 상태 변경 감지');
              authService.signOutUser().catch(console.error);
            }
            break;
            
          case 'googleLoginSuccess':
            console.log('네이티브 구글 로그인 성공:', message.value);
            break;
            
          case 'googleLoginFail':
            console.error('네이티브 구글 로그인 실패:', message.value);
            set({ error: message.value, errorCode: 'auth.errors.googleLoginFailed', isLoading: false });
            break;
            
          case 'googleLogoutSuccess':
            console.log('네이티브 구글 로그아웃 성공');
            break;
            
          case 'googleLogoutFail':
            console.error('네이티브 구글 로그아웃 실패:', message.value);
            set({ error: message.value, errorCode: 'auth.errors.googleLogoutFailed', isLoading: false });
            break;
        }
      });

      // 초기화 완료를 기다림
      return new Promise<void>((resolve) => {
        // 약간의 지연 후 resolve (Firebase Auth 상태 확인 시간 확보)
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