import type { User, NativeGoogleLoginSuccess } from '../types';

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

// 네이티브 유저 정보를 앱 User 타입으로 변환
const convertNativeUserInfo = (nativeUserInfo: NativeGoogleLoginSuccess): User => {
  return {
    uid: nativeUserInfo.uid,
    email: nativeUserInfo.email,
    displayName: nativeUserInfo.displayName,
    photoURL: nativeUserInfo.photoURL,
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

// 네이티브 구글 로그인 성공 처리
const handleGoogleLoginSuccess = (nativeUserInfo: NativeGoogleLoginSuccess) => {
  try {
    console.log('=== 네이티브 구글 로그인 성공 처리 시작 ===');
    console.log('받은 사용자 데이터:', nativeUserInfo);
    console.log('사용자 UID:', nativeUserInfo.uid);
    console.log('사용자 이메일:', nativeUserInfo.email);
    console.log('사용자 이름:', nativeUserInfo.displayName);
    
    const user = convertNativeUserInfo(nativeUserInfo);
    console.log('변환된 사용자 정보:', user);
    console.log('변환된 UID:', user.uid);
    
    // Firebase Auth에 로그인하기 위해 네이티브에서 받은 토큰 사용
    console.log('Firebase Auth에 네이티브 토큰으로 로그인 시작...');
    
    import('firebase/auth').then(({ signInWithCredential, GoogleAuthProvider, getAuth }) => {
      import('../firebase').then(({ auth }) => {
        // 네이티브에서 받은 토큰으로 Firebase Auth 로그인
        const credential = GoogleAuthProvider.credential(nativeUserInfo.idToken);
        
        signInWithCredential(auth, credential).then((userCredential) => {
          console.log('✅ Firebase Auth 로그인 성공:', userCredential.user);
          
          // Firestore에 사용자 정보 저장
          console.log('Firestore에 사용자 정보 저장 시작...');
          import('firebase/firestore').then(({ doc, setDoc, getDoc }) => {
            import('../firebase').then(({ db }) => {
              const userData: Record<string, any> = {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt.toISOString(),
                lastLoginAt: user.lastLoginAt.toISOString(),
              };

              if (user.displayName !== undefined) {
                userData.displayName = user.displayName;
              }
              if (user.photoURL !== undefined) {
                userData.photoURL = user.photoURL;
              }

              console.log('Firestore 사용자 문서 경로:', `users/${user.uid}`);
              console.log('저장할 사용자 데이터:', userData);

              setDoc(doc(db, 'users', user.uid), userData).then(async () => {
                console.log('✅ Firestore에 사용자 정보 저장 완료');
                
                // 공통 로그인 처리 함수 사용
                try {
                  const { handleUserLogin } = await import('./auth');
                  await handleUserLogin(user, undefined, '네이티브 로그인');
                } catch (error) {
                  console.error('네이티브 로그인 - 공통 로그인 처리 중 오류:', error);
                }
                
                // 인증 스토어에 사용자 정보 설정
                console.log('인증 스토어에 사용자 정보 설정 시작...');
                import('../stores/authStore').then(({ useAuthStore }) => {
                  const setUser = useAuthStore.getState().setUser;
                  console.log('설정할 사용자 정보:', user);
                  setUser(user);
                  console.log('✅ 인증 스토어에 사용자 정보 설정 완료');
                  
                  // 로그인 완료 이벤트 발생
                  import('./webviewBridge').then(({ notifyGoogleLoginComplete }) => {
                    notifyGoogleLoginComplete();
                  });
                  
                  // 스토어 상태 확인
                  setTimeout(() => {
                    const currentUser = useAuthStore.getState().user;
                    console.log('설정 후 인증 스토어 상태:', currentUser);
                    console.log('설정 후 사용자 UID:', currentUser?.uid);
                  }, 100);
                });
              }).catch((error: any) => {
                console.error('❌ Firestore 사용자 정보 저장 실패:', error);
                console.error('에러 코드:', error.code);
                console.error('에러 메시지:', error.message);
              });
            });
          });
        }).catch((error: any) => {
          console.error('❌ Firebase Auth 로그인 실패:', error);
          console.error('에러 코드:', error.code);
          console.error('에러 메시지:', error.message);
          
                     // Firebase Auth 로그인 실패 시에도 스토어에 사용자 정보 설정 (오프라인 모드)
           console.log('Firebase Auth 로그인 실패, 오프라인 모드로 진행...');
           
           // 오프라인 모드에서도 공통 로그인 처리 함수 사용
           import('./auth').then(({ handleUserLogin }) => {
             handleUserLogin(user, undefined, '네이티브 로그인 (오프라인)').catch((error) => {
               console.error('네이티브 로그인 (오프라인) - 공통 로그인 처리 중 오류:', error);
             });
           }).catch((error) => {
             console.error('네이티브 로그인 (오프라인) - 공통 로그인 처리 중 오류:', error);
           });
           
           // 인증 스토어에 사용자 정보 설정
           import('../stores/authStore').then(({ useAuthStore }) => {
             const setUser = useAuthStore.getState().setUser;
             setUser(user);
             console.log('✅ 오프라인 모드로 인증 스토어에 사용자 정보 설정 완료');
             
             // 로그인 완료 이벤트 발생
             import('./webviewBridge').then(({ notifyGoogleLoginComplete }) => {
               notifyGoogleLoginComplete();
             });
           });
         });
       });
     });
    
    console.log('=== 네이티브 구글 로그인 성공 처리 완료 ===');
  } catch (error) {
    console.error('=== 네이티브 구글 로그인 성공 처리 중 오류 ===');
    console.error('에러 타입:', typeof error);
    console.error('에러 객체:', error);
    console.error('에러 메시지:', error instanceof Error ? error.message : '알 수 없는 오류');
    console.error('에러 스택:', error instanceof Error ? error.stack : '스택 정보 없음');
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
      const message = JSON.parse(event.data);
      console.log('파싱된 메시지:', message);
      console.log('메시지 타입:', message.type);
      
      handleNativeMessage(message);
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
      const message = JSON.parse(event.data);
      handleNativeMessage(message);
    } catch (error) {
      console.error('document message 파싱 오류:', error);
    }
  });
  
  // window.onmessage도 설정
  window.onmessage = (event: any) => {
    console.log('=== window.onmessage 수신 ===');
    console.log('이벤트 데이터:', event.data);
    try {
      const message = JSON.parse(event.data);
      handleNativeMessage(message);
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
