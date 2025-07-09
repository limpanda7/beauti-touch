import type { User } from '../types';

interface WebViewMessage {
  type: string;
  value?: any;
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
  switch (message.type) {
    case 'googleLoginSuccess':
      // 단순히 메시지만 전달 (AuthService에서 처리)
      console.log('네이티브 구글 로그인 성공 메시지 수신');
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

// 로그인 완료 시 로딩 상태 해제를 위한 이벤트 발생
export const notifyGoogleLoginComplete = () => {
  // 커스텀 이벤트 발생
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('googleLoginComplete'));
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

// 전역 메시지 리스너 설정
if (typeof window !== 'undefined') {
  // 디버깅: 메시지 수신 카운터
  let messageReceiveCount = 0;
  
  window.addEventListener('message', (event) => {
    messageReceiveCount++;
    console.log(`=== 웹뷰 메시지 수신 #${messageReceiveCount} ===`);
    console.log('이벤트 타입:', event.type);
    console.log('이벤트 소스:', event.source);
    console.log('이벤트 origin:', event.origin);
    console.log('원본 데이터:', event.data);
    
    try {
      // Firebase Auth 내부 메시지 무시 (!_ 접두사)
      if (typeof event.data === 'string' && event.data.startsWith('!_')) {
        console.log('Firebase Auth 내부 메시지 무시:', event.data.substring(0, 50) + '...');
        return;
      }
      
      const message = JSON.parse(event.data);
      console.log('파싱된 메시지:', message);
      console.log('메시지 타입:', message.type);
      
      // 네이티브 메시지만 처리
      if (message.type && (message.type === 'googleLoginSuccess' || message.type === 'googleLoginFail' || 
                          message.type === 'googleLogoutSuccess' || message.type === 'googleLogoutFail')) {
        handleNativeMessage(message);
      } else {
        console.log('네이티브 메시지가 아님, 무시:', message.type);
      }
    } catch (error) {
      console.error('메시지 파싱 오류:', error);
      console.error('파싱 실패한 원본 데이터:', event.data);
    }
    
    console.log(`=== 웹뷰 메시지 처리 완료 #${messageReceiveCount} ===`);
  });
  
  // 추가 디버깅: 다른 메시지 리스너들도 등록
  document.addEventListener('message', (event: any) => {
    console.log('=== document.addEventListener("message") 수신 ===');
    console.log('이벤트 데이터:', event.data);
    try {
      // Firebase Auth 내부 메시지 무시
      if (typeof event.data === 'string' && event.data.startsWith('!_')) {
        console.log('Firebase Auth 내부 메시지 무시 (document):', event.data.substring(0, 50) + '...');
        return;
      }
      
      const message = JSON.parse(event.data);
      if (message.type && (message.type === 'googleLoginSuccess' || message.type === 'googleLoginFail' || 
                          message.type === 'googleLogoutSuccess' || message.type === 'googleLogoutFail')) {
        handleNativeMessage(message);
      }
    } catch (error) {
      console.error('document message 파싱 오류:', error);
    }
  });
  
  // window.onmessage도 설정
  window.onmessage = (event: any) => {
    console.log('=== window.onmessage 수신 ===');
    console.log('이벤트 데이터:', event.data);
    try {
      // Firebase Auth 내부 메시지 무시
      if (typeof event.data === 'string' && event.data.startsWith('!_')) {
        console.log('Firebase Auth 내부 메시지 무시 (window):', event.data.substring(0, 50) + '...');
        return;
      }
      
      const message = JSON.parse(event.data);
      if (message.type && (message.type === 'googleLoginSuccess' || message.type === 'googleLoginFail' || 
                          message.type === 'googleLogoutSuccess' || message.type === 'googleLogoutFail')) {
        handleNativeMessage(message);
      }
    } catch (error) {
      console.error('window.onmessage 파싱 오류:', error);
    }
  };
}

// 전역 타입 선언
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
