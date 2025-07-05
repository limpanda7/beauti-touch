import { signInWithNativeGoogle } from './auth';
import type { GoogleLoginResponse, WebViewGoogleLoginMessage } from '../types';

interface WebViewMessage {
  type: string;
  value?: any;
}

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  idToken: string | null;
}

// 웹뷰 메시지 리스너 등록
let messageListener: ((message: WebViewMessage) => void) | null = null;

// 웹뷰 메시지 리스너 설정
export const setWebViewMessageListener = (listener: (message: WebViewMessage) => void) => {
  messageListener = listener;
};

// 웹뷰 메시지 리스너 제거
export const removeWebViewMessageListener = () => {
  messageListener = null;
};

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

// 네이티브 앱에서 받은 메시지 처리
export const handleNativeMessage = (message: WebViewMessage) => {
  console.log('네이티브 앱에서 받은 메시지:', message);
  
  switch (message.type) {
    case 'googleLoginSuccess':
      handleGoogleLoginSuccess(message.value);
      break;
      
    case 'googleLoginFail':
      handleGoogleLoginFail(message.value);
      break;
      
    case 'googleLogoutSuccess':
      handleGoogleLogoutSuccess();
      break;
      
    case 'googleLogoutFail':
      handleGoogleLogoutFail(message.value);
      break;
      
    default:
      console.log('알 수 없는 메시지 타입:', message.type);
      break;
  }
  
  // 등록된 리스너가 있으면 호출
  if (messageListener) {
    messageListener(message);
  }
};

// 구글 로그인 성공 처리
const handleGoogleLoginSuccess = async (googleResponse: GoogleLoginResponse) => {
  try {
    console.log('구글 로그인 성공 응답 받음:', googleResponse);
    
    // 파이어베이스 로그인 처리
    const user = await signInWithNativeGoogle(googleResponse);
    console.log('파이어베이스 로그인 완료:', user);
    
    // 성공 콜백 호출 (필요한 경우)
    if (messageListener) {
      messageListener({
        type: 'googleLoginSuccess',
        value: user
      });
    }
  } catch (error) {
    console.error('구글 로그인 처리 실패:', error);
    
    // 실패 콜백 호출
    if (messageListener) {
      messageListener({
        type: 'googleLoginFail',
        value: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      });
    }
  }
};

// 구글 로그인 실패 처리
const handleGoogleLoginFail = (errorMessage: string) => {
  console.error('구글 로그인 실패:', errorMessage);
  // 에러 처리 로직
};

// 구글 로그아웃 성공 처리
const handleGoogleLogoutSuccess = () => {
  console.log('구글 로그아웃 성공');
  // 로그아웃 성공 처리 로직
};

// 구글 로그아웃 실패 처리
const handleGoogleLogoutFail = (errorMessage: string) => {
  console.error('구글 로그아웃 실패:', errorMessage);
  // 에러 처리 로직
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

// 전역 메시지 리스너 설정
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);
      handleNativeMessage(message);
    } catch (error) {
      console.error('메시지 파싱 오류:', error);
    }
  });
}

// React Native WebView 타입 정의
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
} 