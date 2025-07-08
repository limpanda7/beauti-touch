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

// 웹뷰 메시지 리스너 등록
let messageListener: ((message: WebViewMessage) => void) | null = null;

// 웹뷰 메시지 리스너 설정
export const setWebViewMessageListener = (listener: (message: WebViewMessage) => void) => {
  messageListener = listener;
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
  console.log('=== 네이티브 앱에서 받은 메시지 처리 시작 ===');
  console.log('메시지 타입:', message.type);
  console.log('메시지 값:', message.value);
  
  switch (message.type) {
    case 'userLoginSuccess':
      console.log('네이티브 유저 로그인 성공 메시지 처리');
      handleUserLoginSuccess(message.value);
      break;
      
    case 'userLoginFail':
      console.log('네이티브 유저 로그인 실패 메시지 처리');
      handleUserLoginFail(message.value);
      break;
      
    case 'userLogoutSuccess':
      console.log('네이티브 유저 로그아웃 성공 메시지 처리');
      handleUserLogoutSuccess();
      break;
      
    case 'userLogoutFail':
      console.log('네이티브 유저 로그아웃 실패 메시지 처리');
      handleUserLogoutFail(message.value);
      break;

    case 'authStatusSuccess':
      console.log('네이티브 인증 상태 확인 성공 메시지 처리');
      handleAuthStatusSuccess(message.value);
      break;

    case 'authStatusFail':
      console.log('네이티브 인증 상태 확인 실패 메시지 처리');
      handleAuthStatusFail(message.value);
      break;
      
    default:
      console.log('알 수 없는 메시지 타입:', message.type);
      break;
  }
  
  // 등록된 리스너가 있으면 호출
  if (messageListener) {
    console.log('등록된 메시지 리스너 호출');
    messageListener(message);
  } else {
    console.log('등록된 메시지 리스너가 없습니다.');
  }
  
  console.log('=== 네이티브 앱에서 받은 메시지 처리 완료 ===');
};

// 네이티브 유저 로그인 성공 처리
const handleUserLoginSuccess = (nativeUserInfo: NativeUserInfo) => {
  console.log('=== 네이티브 유저 로그인 성공 처리 시작 ===');
  console.log('네이티브 유저 정보 받음:', nativeUserInfo);
  
  try {
    // 네이티브 유저 정보를 앱 User 타입으로 변환
    const user = convertNativeUserInfo(nativeUserInfo);
    console.log('변환된 유저 정보:', user);
    
    // 등록된 메시지 리스너 호출
    if (messageListener) {
      console.log('등록된 메시지 리스너 호출 - 성공');
      messageListener({
        type: 'userLoginSuccess',
        value: user
      });
    }
    
    console.log('=== 네이티브 유저 로그인 처리 성공 완료 ===');
    
  } catch (error) {
    console.error('=== 네이티브 유저 로그인 처리 실패 ===');
    console.error('에러:', error);
    
    // 등록된 메시지 리스너 호출 (실패)
    if (messageListener) {
      console.log('메시지 리스너 호출 - 실패');
      messageListener({
        type: 'userLoginFail',
        value: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      });
    }
    
    console.log('=== 네이티브 유저 로그인 처리 실패 완료 ===');
  }
};

// 네이티브 유저 로그인 실패 처리
const handleUserLoginFail = (errorMessage: string) => {
  console.error('네이티브 유저 로그인 실패:', errorMessage);
  
  // 등록된 메시지 리스너 호출 (실패)
  if (messageListener) {
    messageListener({
      type: 'userLoginFail',
      value: errorMessage
    });
  }
};

// 네이티브 유저 로그아웃 성공 처리
const handleUserLogoutSuccess = () => {
  console.log('네이티브 유저 로그아웃 성공');
  
  // 등록된 메시지 리스너 호출
  if (messageListener) {
    messageListener({
      type: 'userLogoutSuccess'
    });
  }
};

// 네이티브 유저 로그아웃 실패 처리
const handleUserLogoutFail = (errorMessage: string) => {
  console.error('네이티브 유저 로그아웃 실패:', errorMessage);
  
  // 등록된 메시지 리스너 호출 (실패)
  if (messageListener) {
    messageListener({
      type: 'userLogoutFail',
      value: errorMessage
    });
  }
};

// 네이티브 인증 상태 확인 성공 처리
const handleAuthStatusSuccess = (authStatus: { isSignedIn: boolean; user: NativeUserInfo | null }) => {
  console.log('네이티브 인증 상태 확인 성공:', authStatus);
  
  if (authStatus.isSignedIn && authStatus.user) {
    const user = convertNativeUserInfo(authStatus.user);
    console.log('변환된 유저 정보:', user);
    
    // 등록된 메시지 리스너 호출
    if (messageListener) {
      messageListener({
        type: 'authStatusSuccess',
        value: { isSignedIn: true, user }
      });
    }
  } else {
    // 등록된 메시지 리스너 호출
    if (messageListener) {
      messageListener({
        type: 'authStatusSuccess',
        value: { isSignedIn: false, user: null }
      });
    }
  }
};

// 네이티브 인증 상태 확인 실패 처리
const handleAuthStatusFail = (errorMessage: string) => {
  console.error('네이티브 인증 상태 확인 실패:', errorMessage);
  
  // 등록된 메시지 리스너 호출 (실패)
  if (messageListener) {
    messageListener({
      type: 'authStatusFail',
      value: errorMessage
    });
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

// 전역 메시지 리스너 설정
if (typeof window !== 'undefined') {
  console.log('웹뷰 브리지 초기화: 전역 메시지 리스너 설정');
  
  // React Native WebView에서 직접 메시지를 받는 경우도 처리
  if (window.ReactNativeWebView) {
    console.log('React Native WebView 환경 감지됨');
    
    // 기존 postMessage 함수를 백업
    const originalPostMessage = window.ReactNativeWebView.postMessage;
    
    // postMessage 호출 시 로그 추가
    window.ReactNativeWebView.postMessage = (message: string) => {
      console.log('네이티브로 메시지 전송:', message);
      originalPostMessage(message);
    };
    
    console.log('React Native WebView 메시지 리스너 설정 완료');
  }
  
  // 일반적인 window message 이벤트 리스너 설정
  window.addEventListener('message', (event) => {
    console.log('=== 전역 메시지 이벤트 수신 ===');
    console.log('이벤트 데이터:', event.data);
    console.log('이벤트 소스:', event.source);
    console.log('이벤트 오리진:', event.origin);
    
    try {
      const message = JSON.parse(event.data);
      console.log('파싱된 메시지:', message);
      handleNativeMessage(message);
    } catch (error) {
      console.error('메시지 파싱 오류:', error);
      console.error('원본 데이터:', event.data);
    }
  });
}
