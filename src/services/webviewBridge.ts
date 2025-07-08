import type { User } from '../types';

interface WebViewMessage {
  type: string;
  value?: any;
}

interface NativeUserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

// 네이티브 앱으로 메시지 전송
export const postMessageToNative = (type: string, value?: any) => {
  const message = { type, value };
  
  // React Native WebView에서 메시지를 받을 수 있도록 window.ReactNativeWebView.postMessage 사용
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
    console.log('네이티브 앱으로 메시지 전송:', message);
  } else {
    console.log('웹뷰 환경이 아닙니다. 메시지:', message);
  }
};

// 네이티브 유저 정보를 앱 User 타입으로 변환
const convertNativeUserInfo = (nativeUserInfo: NativeUserInfo): User => {
  return {
    uid: nativeUserInfo.uid,
    email: nativeUserInfo.email || '',
    displayName: nativeUserInfo.displayName || undefined,
    photoURL: nativeUserInfo.photoURL || undefined,
    emailVerified: nativeUserInfo.emailVerified,
    createdAt: new Date(nativeUserInfo.createdAt),
    lastLoginAt: new Date(nativeUserInfo.lastLoginAt),
  };
};

// 네이티브 앱에서 받은 메시지 처리
export const handleNativeMessage = (message: WebViewMessage) => {
  switch (message.type) {
    case 'googleLoginSuccess':
      handleGoogleLoginSuccess(message.value);
      break;
      
    default:
      console.log('알 수 없는 메시지 타입:', message.type);
      break;
  }
};

// 네이티브 구글 로그인 성공 처리
const handleGoogleLoginSuccess = (nativeUserInfo: NativeUserInfo) => {
  try {
    const user = convertNativeUserInfo(nativeUserInfo);
  } catch (error) {
    console.error(error);
  }
};

// 네이티브 앱에 구글 로그인 요청
export const requestGoogleLogin = () => {
  postMessageToNative('googleLogin');
};

// 네이티브 앱에 구글 로그아웃 요청
export const requestGoogleLogout = () => {
  postMessageToNative('googleLogout');
};

// 웹뷰 환경인지 확인
export const isWebViewEnvironment = (): boolean => {
  return !!(window.ReactNativeWebView);
};

// 전역 타입 선언
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
