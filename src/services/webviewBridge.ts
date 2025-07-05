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
  console.log('=== 네이티브 앱에서 받은 메시지 처리 시작 ===');
  console.log('메시지 타입:', message.type);
  console.log('메시지 값:', message.value);
  
  switch (message.type) {
    case 'googleLoginSuccess':
      console.log('구글 로그인 성공 메시지 처리 시작');
      handleGoogleLoginSuccess(message.value);
      break;
      
    case 'googleLoginFail':
      console.log('구글 로그인 실패 메시지 처리');
      handleGoogleLoginFail(message.value);
      break;
      
    case 'googleLogoutSuccess':
      console.log('구글 로그아웃 성공 메시지 처리');
      handleGoogleLogoutSuccess();
      break;
      
    case 'googleLogoutFail':
      console.log('구글 로그아웃 실패 메시지 처리');
      handleGoogleLogoutFail(message.value);
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

// 구글 로그인 성공 처리
const handleGoogleLoginSuccess = async (googleResponse: GoogleLoginResponse) => {
  console.log('=== 구글 로그인 성공 처리 시작 ===');
  console.log('구글 로그인 성공 응답 받음:', googleResponse);
  
  try {
    // 네이티브에 진행상황 메시지 전송
    postMessageToNative('googleLoginProgress', {
      status: 'processing',
      message: 'Firebase 인증 처리 중...'
    });
    
    // 파이어베이스 로그인 처리 시작...
    console.log('파이어베이스 로그인 처리 시작...');
    const user = await signInWithNativeGoogle(googleResponse);
    
    // 네이티브에 성공 메시지 전송
    postMessageToNative('googleLoginProgress', {
      status: 'success',
      message: '로그인 완료'
    });
    
    // 등록된 메시지 리스너 호출
    if (messageListener) {
      console.log('등록된 메시지 리스너 호출');
      messageListener({
        type: 'googleLoginSuccess',
        value: user
      });
    }
    
    console.log('=== 구글 로그인 처리 성공 완료 ===');
    
  } catch (error) {
    console.error('=== 구글 로그인 처리 실패 ===');
    console.error('에러 타입:', typeof error);
    console.error('에러 객체:', error);
    console.error('에러 메시지:', error instanceof Error ? error.message : '알 수 없는 오류');
    console.error('에러 스택:', error instanceof Error ? error.stack : '스택 없음');
    
    // Firebase 인증 실패 시에도 테스트용 사용자 정보 생성
    if (error instanceof Error && error.message.includes('토큰이 만료되었거나 유효하지 않습니다')) {
      console.log('Firebase 인증 실패, 테스트용 사용자 정보 생성');
      
      const testUser = {
        uid: 'test-user-' + Date.now(),
        email: googleResponse.email,
        displayName: googleResponse.name,
        photoURL: googleResponse.photo,
        emailVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      // 네이티브에 실패 메시지 전송
      postMessageToNative('googleLoginFail', error.message);
      
      // 등록된 메시지 리스너 호출 (실패)
      if (messageListener) {
        console.log('메시지 리스너 호출 - 실패');
        messageListener({
          type: 'googleLoginFail',
          value: error.message
        });
      }
    } else {
      // 네이티브에 실패 메시지 전송
      postMessageToNative('googleLoginFail', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      
      // 등록된 메시지 리스너 호출 (실패)
      if (messageListener) {
        console.log('메시지 리스너 호출 - 실패');
        messageListener({
          type: 'googleLoginFail',
          value: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        });
      }
    }
    
    console.log('=== 구글 로그인 처리 실패 완료 ===');
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
  console.log('웹뷰 브리지 초기화: 전역 메시지 리스너 설정');
  
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
  }
}

// React Native WebView 타입 정의
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    // 테스트용 전역 함수
    testNativeGoogleLogin?: () => void;
    testNativeGoogleLoginWithoutFirebase?: () => void;
  }
}

// 테스트용 전역 함수들 (브라우저에서만 사용)
if (typeof window !== 'undefined' && !isWebViewEnvironment()) {
  // 네이티브 구글 로그인 응답 시뮬레이션 (Firebase 인증 포함)
  (window as any).testNativeGoogleLogin = () => {
    console.log('테스트: 네이티브 구글 로그인 응답 시뮬레이션');
    
    const testResponse = {
      type: 'googleLoginSuccess',
      value: {
        photo: 'https://lh3.googleusercontent.com/a/ACg8ocJIpma2ZHB4X7V-gg7vNqOqPo0mvZpgu34mAoKaU8LgPUbAvXc=s96-c',
        givenName: '성훈',
        familyName: '임',
        email: 'limpanda7@gmail.com',
        name: '임성훈',
        id: '118431536161630265973',
        token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjhlOGZjOGU1NTZmN2E3NmQwOGQzNTgyOWQ2ZjkwYWUyZTEyY2ZkMGQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxOTE5OTgwNTY5MTgtYWZhbWFub245bnJzaWdodmpkNHRqM2lkOWxoZWQ4YzguYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIxOTE5OTgwNTY5MTgtdXZmbmNybXFkcHNhdTliYTgzbzNzdjA3bmE0cm5zZHEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTg0MzE1MzYxNjE2MzAyNjU5NzMiLCJlbWFpbCI6ImxpbXBhbmRhN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IuyehOyEse2biCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKSXBtYTJaSEI0WDdWLWdnN3ZOcU9xUG8wbXZacGd1MzRtQW9LYVU4TGdQVWJBdlhjPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IuyEse2biCIsImZhbWlseV9uYW1lIjoi7J6EIiwiaWF0IjoxNzUxNzIwNjg3LCJleHAiOjE3NTE3MjQyODd9.dtp5_f0jPWrVJzL0WHUjzCiCSQVJIv5Lj238KBNkDoJ0Y0wx0T7vXAcsid9P4FZaSK6ulXJRq14qXyaxB_qssDXnDrsmutI8iBxF3hrlmBo7b2sVjYS3EAcQU66znFgXExO2wrtqHTVdXcpdctQpx2xUQdulyls6QVc6MgEjqL2-IWBcRBiVkCLb1_jFB4SdyaAstUWHw4ZUaMWvbXpVsTWWGZ9XDUsQoTONV_OZvaKHZ-twNORTIrBL3wrtKsbuVVG9f506DBOuiSKvh4BM6i1TiCQkh6Q2mk-hcl6LeJ-uzDrgP2hc5Th-QxX69av47t389Mlg1c8ukT588I_p6g'
      }
    };
    
    console.log('테스트 응답 생성 완료:', testResponse);
    
    // 메시지 이벤트 디스패치
    console.log('메시지 이벤트 디스패치 시작...');
    const event = new MessageEvent('message', {
      data: JSON.stringify(testResponse),
      origin: '',
      source: null
    });
    
    window.dispatchEvent(event);
    console.log('메시지 이벤트 디스패치 완료');
  };

  // 네이티브 구글 로그인 응답 시뮬레이션 (Firebase 인증 없이)
  (window as any).testNativeGoogleLoginWithoutFirebase = () => {
    console.log('테스트: 네이티브 구글 로그인 응답 시뮬레이션 (Firebase 인증 없이)');
    
    const testResponse = {
      type: 'googleLoginSuccess',
      value: {
        photo: 'https://lh3.googleusercontent.com/a/ACg8ocJIpma2ZHB4X7V-gg7vNqOqPo0mvZpgu34mAoKaU8LgPUbAvXc=s96-c',
        givenName: '성훈',
        familyName: '임',
        email: 'limpanda7@gmail.com',
        name: '임성훈',
        id: '118431536161630265973',
        token: 'invalid_test_token'
      }
    };
    
    const event = new MessageEvent('message', {
      data: JSON.stringify(testResponse),
      origin: '',
      source: null
    });
    
    window.dispatchEvent(event);
  };

  // Firebase Auth 없이 직접 스토어에 사용자 정보 설정 (테스트용)
  (window as any).testSetUserDirectly = async () => {
    console.log('테스트: Firebase Auth 없이 직접 스토어에 사용자 정보 설정');
    
    // 동적 import 사용
    const { useAuthStore } = await import('../stores/authStore');
    const authStore = useAuthStore.getState();
    
    const testUser = {
      uid: 'test-user-123',
      email: 'limpanda7@gmail.com',
      displayName: '임성훈',
      photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocJIpma2ZHB4X7V-gg7vNqOqPo0mvZpgu34mAoKaU8LgPUbAvXc=s96-c',
      emailVerified: true,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    
    authStore.setUser(testUser);
    console.log('스토어에 사용자 정보 설정 완료:', testUser);
  };

  // 간단한 테스트 함수 (브라우저 콘솔에서 사용)
  (window as any).testLogin = async () => {
    console.log('간단한 로그인 테스트 시작');
    
    try {
      // 1. 스토어에 사용자 정보 설정
      const { useAuthStore } = await import('../stores/authStore');
      const authStore = useAuthStore.getState();
      
      const testUser = {
        uid: 'test-user-' + Date.now(),
        email: 'test@example.com',
        displayName: '테스트 사용자',
        photoURL: 'https://example.com/photo.jpg',
        emailVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      authStore.setUser(testUser);
      console.log('✅ 사용자 정보 설정 완료:', testUser);
      
      // 2. 페이지 새로고침 없이 상태 확인
      setTimeout(() => {
        const currentState = useAuthStore.getState();
        console.log('✅ 현재 인증 상태:', currentState);
      }, 100);
      
    } catch (error) {
      console.error('❌ 테스트 중 오류 발생:', error);
    }
  };
}
