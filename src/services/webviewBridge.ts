import { signInWithCredential, signOut } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import type { User } from '../types';
import { convertFirebaseUser } from './auth';

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
    case 'firebaseAuthStateChanged':
      handleFirebaseAuthStateChanged(message.value);
      break;
      
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
      
    case 'signInToWebFirebase':
      handleSignInToWebFirebase(message.value);
      break;
      
    case 'signOutFromWebFirebase':
      handleSignOutFromWebFirebase();
      break;
      
    case 'firebaseAuthStatusSuccess':
      handleFirebaseAuthStatusSuccess(message.value);
      break;
      
    case 'firebaseAuthStatusFail':
      handleFirebaseAuthStatusFail(message.value);
      break;
      
    case 'getPlatformSuccess':
      handleGetPlatformSuccess(message.value);
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

// Firebase 인증 상태 변경 처리
const handleFirebaseAuthStateChanged = (data: { isSignedIn: boolean; user: FirebaseUser | null }) => {
  console.log('Firebase 인증 상태 변경:', data);
  
  if (data.isSignedIn && data.user) {
    // 사용자가 로그인된 상태
    console.log('사용자 로그인됨:', data.user);
  } else {
    // 사용자가 로그아웃된 상태
    console.log('사용자 로그아웃됨');
  }
};

// 구글 로그인 성공 처리
const handleGoogleLoginSuccess = (user: FirebaseUser) => {
  console.log('구글 로그인 성공:', user);
  // 여기서 필요한 추가 처리를 할 수 있습니다
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

// 웹 Firebase에 로그인 처리
const handleSignInToWebFirebase = async (data: { idToken: string; user: FirebaseUser }) => {
  try {
    console.log('웹 Firebase에 로그인 시도:', data);
    
    // Google Auth Provider를 사용하여 자격 증명 생성
    const credential = GoogleAuthProvider.credential(data.idToken);
    
    // Firebase Auth에 로그인
    const userCredential = await signInWithCredential(auth, credential);
    
    console.log('웹 Firebase 로그인 성공:', userCredential.user);
    
    // 성공 메시지를 네이티브 앱으로 전송
    postMessageToNative('webFirebaseSignInSuccess', {
      user: convertFirebaseUser(userCredential.user)
    });
    
  } catch (error) {
    console.error('웹 Firebase 로그인 실패:', error);
    
    // 실패 메시지를 네이티브 앱으로 전송
    postMessageToNative('webFirebaseSignInFail', {
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
};

// 웹 Firebase에서 로그아웃 처리
const handleSignOutFromWebFirebase = async () => {
  try {
    console.log('웹 Firebase에서 로그아웃 시도');
    
    await signOut(auth);
    
    console.log('웹 Firebase 로그아웃 성공');
    
    // 성공 메시지를 네이티브 앱으로 전송
    postMessageToNative('webFirebaseSignOutSuccess');
    
  } catch (error) {
    console.error('웹 Firebase 로그아웃 실패:', error);
    
    // 실패 메시지를 네이티브 앱으로 전송
    postMessageToNative('webFirebaseSignOutFail', {
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
};

// Firebase 인증 상태 확인 성공 처리
const handleFirebaseAuthStatusSuccess = (data: { isSignedIn: boolean; user: FirebaseUser | null }) => {
  console.log('Firebase 인증 상태 확인 성공:', data);
  // 인증 상태 확인 결과 처리
};

// Firebase 인증 상태 확인 실패 처리
const handleFirebaseAuthStatusFail = (errorMessage: string) => {
  console.error('Firebase 인증 상태 확인 실패:', errorMessage);
  // 에러 처리 로직
};

// 플랫폼 정보 성공 처리
const handleGetPlatformSuccess = (platform: string) => {
  console.log('플랫폼 정보:', platform);
  // 플랫폼 정보 처리
};

// 네이티브 앱에 구글 로그인 요청
export const requestGoogleLogin = () => {
  postMessageToNative('googleLogin');
};

// 네이티브 앱에 구글 로그아웃 요청
export const requestGoogleLogout = () => {
  postMessageToNative('googleLogout');
};

// 네이티브 앱에 Firebase 인증 상태 확인 요청
export const requestFirebaseAuthStatus = () => {
  postMessageToNative('checkFirebaseAuthStatus');
};

// 네이티브 앱에 플랫폼 정보 요청
export const requestPlatform = () => {
  postMessageToNative('getPlatform');
};

// 네이티브 앱에 알림 표시 요청
export const requestShowAlert = (message: string) => {
  postMessageToNative('showAlert', { message });
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