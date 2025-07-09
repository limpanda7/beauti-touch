// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { isWebViewEnvironment } from "./services/webviewBridge";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbCCCAbtFSclmRBvFthsdw2AA6tam7aRc",
  authDomain: "beauti-touch.firebaseapp.com",
  projectId: "beauti-touch",
  storageBucket: "beauti-touch.firebasestorage.app",
  messagingSenderId: "191998056918",
  appId: "1:191998056918:web:cf12c42fb2f5247a7fec77",
  measurementId: "G-RFFSZRHNGN"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase 초기화 오류:', error);
  // 이미 초기화된 경우 기존 앱 사용
  app = initializeApp(firebaseConfig, 'beauti-touch');
}

export const db = getFirestore(app);
export const auth = getAuth(app);

// 브라우저 감지 및 로그인 지속성 설정
const detectBrowserAndSetPersistence = async () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isNaverBrowser = userAgent.includes('naver') || userAgent.includes('whale');
  const isInAppBrowser = userAgent.includes('wv') || userAgent.includes('line') || userAgent.includes('kakao');
  const isWebView = isWebViewEnvironment();
  
  // 웹뷰 환경에서는 로컬 지속성을 사용하여 로그인 상태 유지
  // 네이버 브라우저나 인앱 브라우저인 경우 세션 지속성 사용
  let persistence;
  if (isWebView) {
    persistence = browserLocalPersistence;
    console.log('웹뷰 환경 감지: 로컬 지속성 사용 (로그인 상태 유지)');
  } else if (isNaverBrowser || isInAppBrowser) {
    persistence = browserSessionPersistence;
    console.log('네이버/인앱 브라우저 감지: 세션 지속성 사용');
  } else {
    persistence = browserLocalPersistence;
    console.log('일반 브라우저: 로컬 지속성 사용');
  }
  
  try {
    await setPersistence(auth, persistence);
    console.log(`Firebase Auth 지속성이 설정되었습니다.`);
    console.log('브라우저 정보:', userAgent);
    console.log('웹뷰 환경:', isWebView);
  } catch (error) {
    console.error('Firebase Auth 지속성 설정 실패:', error);
  }
};

detectBrowserAndSetPersistence();

// 개발 환경에서 에뮬레이터 연결 (선택사항)
if (
  typeof import.meta !== 'undefined' &&
  import.meta.env.MODE === 'development' &&
  import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true'
) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Firestore 에뮬레이터가 이미 연결되어 있습니다.');
  }
}

// Auth 에뮬레이터 연결 (개발 환경)
if (
  typeof import.meta !== 'undefined' &&
  import.meta.env.MODE === 'development' &&
  import.meta.env.VITE_USE_AUTH_EMULATOR === 'true'
) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    console.log('Auth 에뮬레이터가 이미 연결되어 있습니다.');
  }
}