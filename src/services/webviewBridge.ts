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
  }
};

// 네이티브 앱에서 받은 메시지 처리
export const handleNativeMessage = (message: WebViewMessage) => {
  // 등록된 리스너가 있으면 호출
  if (messageListener) {
    messageListener(message);
  }
};



// 웹뷰 환경인지 확인
export const isWebViewEnvironment = (): boolean => {
  return !!(window.ReactNativeWebView);
};

// 전역 메시지 리스너 설정
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    try {
      // Firebase Auth 내부 메시지 무시 (!_ 접두사)
      if (typeof event.data === 'string' && event.data.startsWith('!_')) {
        return;
      }
      
      const message = JSON.parse(event.data);
      
      // 네이티브 메시지만 처리
      if (message.type && (message.type === 'googleLoginSuccess' || message.type === 'googleLoginFail' || 
                          message.type === 'googleLogoutSuccess' || message.type === 'googleLogoutFail')) {
        handleNativeMessage(message);
      }
    } catch (error) {
      // 파싱 오류는 무시
    }
  });
  

}

// 전역 타입 선언
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
