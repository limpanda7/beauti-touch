import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  getAuth,
  getIdToken,
} from 'firebase/auth';
import type { User as FirebaseUser, AuthError as FirebaseAuthError } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User, LoginCredentials, SignUpCredentials, AuthError, GoogleLoginResponse, NativeGoogleLoginSuccess } from '../types';
import { createAllTestData } from '../utils/testData';
import { getCurrentLanguage } from '../utils/languageUtils';
import { getDefaultCurrencyForLanguage } from '../utils/currency';
import { isWebViewEnvironment, postMessageToNative, setWebViewMessageListener } from '../services/webviewBridge';
import { useLanguageStore } from '../stores/languageStore';

// Firebase 에러 코드를 다국어 키로 변환하는 함수
const getErrorTranslationKey = (errorCode: string): string => {
  const errorKeyMap: Record<string, string> = {
    'auth/user-not-found': 'auth.errors.userNotFound',
    'auth/wrong-password': 'auth.errors.wrongPassword',
    'auth/email-already-in-use': 'auth.errors.emailAlreadyInUse',
    'auth/weak-password': 'auth.errors.weakPassword',
    'auth/invalid-email': 'auth.errors.invalidEmail',
    'auth/too-many-requests': 'auth.errors.tooManyRequests',
    'auth/network-request-failed': 'auth.errors.networkRequestFailed',
    'auth/user-disabled': 'auth.errors.userDisabled',
    'auth/operation-not-allowed': 'auth.errors.operationNotAllowed',
    'auth/invalid-credential': 'auth.errors.invalidCredential',
    'auth/popup-closed-by-user': 'auth.errors.popupClosedByUser',
    'auth/popup-blocked': 'auth.errors.popupBlocked',
    'auth/cancelled-popup-request': 'auth.errors.cancelledPopupRequest',
    'auth/account-exists-with-different-credential': 'auth.errors.accountExistsWithDifferentCredential',
    'auth/requires-recent-login': 'auth.errors.requiresRecentLogin',
  };

  return errorKeyMap[errorCode] || 'auth.errors.unknownError';
};

// Firebase User를 앱 User 타입으로 변환
export const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  console.log('convertFirebaseUser 호출:', { 
    firebaseUser, 
    uid: firebaseUser.uid, 
    email: firebaseUser.email,
    metadata: firebaseUser.metadata 
  });
  
  if (!firebaseUser.uid) {
    console.error('Firebase User의 uid가 없습니다:', firebaseUser);
    throw new Error('Firebase User의 uid가 없습니다.');
  }
  
  const user = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || undefined,
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
  };
  
  console.log('변환된 User 객체:', user);
  return user;
};

// 사용자 정보를 Firestore에 저장
const saveUserToFirestore = async (user: User) => {
  try {
    // Firestore에 저장할 데이터 준비 (undefined 값 제거)
    const userData: Record<string, any> = {
      uid: user.uid,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt.toISOString(),
    };

    // undefined가 아닌 값들만 추가
    if (user.displayName !== undefined) {
      userData.displayName = user.displayName;
    }

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    throw error; // 에러를 상위로 전파
  }
};

// 기존 사용자의 빈 문서를 업데이트하는 함수
export const updateExistingUserDocument = async (user: User) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const existingData = userDoc.data() || {};
      // 실제 사용자 데이터 필드가 있는지 확인 (하위 컬렉션은 무시)
      const hasUserData = (
        existingData.uid ||
        existingData.email ||
        existingData.createdAt ||
        existingData.displayName
      );

      // 사용자 데이터가 없거나 최소한의 데이터만 있는 경우 업데이트
      if (!hasUserData || !existingData.email || !existingData.createdAt) {
        const userData: Record<string, any> = {
          uid: user.uid,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt.toISOString(),
        };

        if (user.displayName !== undefined) {
          userData.displayName = user.displayName;
        }

        await setDoc(userRef, userData, { merge: true });
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
};

// 신규 사용자 여부를 확인하는 공통 함수
const checkNewUserStatus = async (user: User, firebaseUser?: any, context: string = 'unknown') => {
  // Firestore에서 기존 사용자 정보 확인
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  // 문서가 존재하고 실제 사용자 데이터 필드가 있는지 확인
  // 하위 컬렉션은 상위 문서의 존재 여부와 무관하므로 필드 데이터만 확인
  const docData = userDoc.data() || {};
  const hasUserData = userDoc.exists() && (
    docData.uid ||
    docData.email ||
    docData.createdAt ||
    docData.displayName
  );

  const isNewUser = !hasUserData;
  const shouldCreateTestData = !hasUserData; // 문서가 없으면 신규 사용자

  return { isNewUser, shouldCreateTestData };
};

// 신규 사용자를 위한 초기 설정을 처리하는 공통 함수
const handleNewUserSetup = async (user: User, context: string = 'unknown') => {
  try {

    // 먼저 상위 사용자 문서 생성 (하위 컬렉션을 생성하기 전에)
    const userRef = doc(db, 'users', user.uid);
    const userData: Record<string, any> = {
      uid: user.uid,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt.toISOString(),
    };

    if (user.displayName !== undefined) {
      userData.displayName = user.displayName;
    }

    await setDoc(userRef, userData, { merge: true });

    // 언어 설정 저장 - 언어 스토어에서 현재 언어 가져오기
    let currentLanguage: string;
    try {
      // 언어 스토어에서 현재 언어 가져오기 시도
      const languageStore = useLanguageStore.getState();
      currentLanguage = languageStore.currentLanguage;
    } catch (error) {
      // 언어 스토어 접근 실패 시 fallback으로 getCurrentLanguage 사용
      console.warn('언어 스토어 접근 실패, fallback 사용:', error);
      currentLanguage = getCurrentLanguage();
    }

    const settingsData = {
      language: currentLanguage,
      currency: getDefaultCurrencyForLanguage(currentLanguage)
    };

    // 사용자 문서에 settings 필드로 저장
    await setDoc(userRef, { settings: settingsData }, { merge: true });

    // 테스트 데이터 생성

    try {
          const result = await createAllTestData();
  } catch (testDataError) {
    // 앱 환경에서는 테스트 데이터 생성 실패 시 재시도
    if (isWebViewEnvironment() && context === '네이티브 Google 로그인') {
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const retryResult = await createAllTestData();
      } catch (retryError) {
        // 재시도 실패 시 무시
      }
    }
  }
} catch (error) {
  throw error; // 에러를 상위로 전파
}
};

// 사용자 로그인 후 처리를 위한 공통 함수
export const handleUserLogin = async (user: User, firebaseUser?: any, context: string = 'unknown') => {
  try {
    // 신규 사용자 여부를 먼저 확인
    const { isNewUser, shouldCreateTestData } = await checkNewUserStatus(user, firebaseUser, context);

    // 신규 사용자인 경우에만 테스트 데이터 생성
    if (shouldCreateTestData) {
      // 신규 사용자인 경우 handleNewUserSetup에서 사용자 문서도 함께 생성
      await handleNewUserSetup(user, context);
    } else {
      // 기존 사용자인 경우에만 사용자 정보 저장 및 업데이트
      await saveUserToFirestore(user);

      // 기존 사용자 문서 업데이트 (빈 문서가 있는 경우)
      await updateExistingUserDocument(user);
    }
  } catch (error) {
    throw error; // 에러를 상위로 전파
  }
};

// 회원가입
export const signUp = async (credentials: SignUpCredentials): Promise<User> => {
  try {
    // 비밀번호 확인
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // Firebase Auth로 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    const firebaseUser = userCredential.user;

    // 프로필 업데이트
    if (credentials.displayName) {
      await updateProfile(firebaseUser, {
        displayName: credentials.displayName,
      });
    }

    // 사용자 정보 생성
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: credentials.displayName,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
    };

    // 신규 사용자 설정 처리
    await handleUserLogin(user, undefined, '회원가입');

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    const firebaseError = error as FirebaseAuthError;
    // 개발자를 위해 raw error message 전달
    const rawErrorMessage = `회원가입 실패 - Code: ${firebaseError.code}, Message: ${firebaseError.message}`;
    throw new Error(rawErrorMessage);
  }
};

// 로그인
export const signIn = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    const firebaseUser = userCredential.user;

    const user = convertFirebaseUser(firebaseUser);

    // 신규 사용자 설정 처리 (기존 사용자 로그인의 경우 테스트 데이터 생성되지 않음)
    await handleUserLogin(user, firebaseUser, '로그인');

    return user;
  } catch (error) {
    const firebaseError = error as FirebaseAuthError;
    // 개발자를 위해 raw error message 전달
    const rawErrorMessage = `로그인 실패 - Code: ${firebaseError.code}, Message: ${firebaseError.message}`;
    throw new Error(rawErrorMessage);
  }
};

// 로그아웃
export const signOutUser = async (): Promise<void> => {
  try {
    // 웹뷰 환경에서는 네이티브 로그아웃 사용
    if (isWebViewEnvironment()) {
      return new Promise((resolve, reject) => {
        postMessageToNative('googleLogout');

        // 메시지 리스너 설정
        const handleNativeMessage = (message: any) => {
          if (message.type === 'googleLogoutSuccess') {
            resolve();
          } else if (message.type === 'googleLogoutFail') {
            // 개발자를 위해 raw error message 전달
            const rawErrorMessage = `네이티브 로그아웃 실패 - ${message.value || '알 수 없는 오류'}`;
            reject(new Error(rawErrorMessage));
          }
        };

        // 일회성 메시지 리스너 등록
        setWebViewMessageListener(handleNativeMessage);

        // 타임아웃 설정
        setTimeout(() => {
          reject(new Error('네이티브 로그아웃 타임아웃 - 5초 후 응답 없음'));
        }, 5000);
      });
    } else {
      // 웹 환경에서는 Firebase Auth 로그아웃
      await signOut(auth);
    }
  } catch (error) {
    // 개발자를 위해 raw error message 전달
    const rawErrorMessage = `로그아웃 실패 - ${error instanceof Error ? error.message : String(error)}`;
    throw new Error(rawErrorMessage);
  }
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  const firebaseUser = auth.currentUser;
  return firebaseUser ? convertFirebaseUser(firebaseUser) : null;
};

// 웹뷰 환경에서 Firebase Auth 토큰 유효성 검증
const validateAuthToken = async (): Promise<boolean> => {
  if (!isWebViewEnvironment()) {
    return true; // 웹뷰가 아닌 경우 검증 건너뜀
  }

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }

    // 토큰 갱신 시도
    const token = await getIdToken(currentUser, true);
    return !!token;
  } catch (error) {
    return false;
  }
};

// 인증 상태 변경 감지
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // 웹뷰 환경에서 토큰 유효성 검증
      if (isWebViewEnvironment()) {
        const isValid = await validateAuthToken();
        if (!isValid) {
          await signOutUser();
          callback(null);
          return;
        }
      }

      const user = convertFirebaseUser(firebaseUser);
      callback(user);
    } else {
      callback(null);
    }
  });
};

// 사용자 정보 업데이트
export const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('로그인된 사용자가 없습니다.');
    }

    // Firebase Auth 프로필 업데이트
    const authUpdates: { displayName?: string } = {};
    if (updates.displayName !== undefined) {
      authUpdates.displayName = updates.displayName;
    }

    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(currentUser, authUpdates);
    }

    // Firestore 사용자 정보 업데이트
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // undefined가 아닌 값들만 필터링
      const cleanUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });

      await setDoc(userRef, {
        ...userData,
        ...cleanUpdates,
        lastLoginAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    throw new Error('사용자 정보 업데이트 중 오류가 발생했습니다.');
  }
};

// 브라우저 감지 함수
const detectProblematicBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('naver') ||
         userAgent.includes('whale') ||
         userAgent.includes('wv') ||
         userAgent.includes('line') ||
         userAgent.includes('kakao');
};

// Google 로그인
export const signInWithGoogle = async (): Promise<User> => {
  try {
    // 웹뷰 환경에서는 네이티브 구글 로그인 사용
    if (isWebViewEnvironment()) {
      return await signInWithNativeGoogle();
    }

    // 웹 환경 - 기존 로직 유지
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    // 문제가 있는 브라우저인지 확인
    const isProblematicBrowser = detectProblematicBrowser();

    let userCredential;

    if (isProblematicBrowser) {
      // 리다이렉트 방식 사용
      await signInWithRedirect(auth, provider);
      // 리다이렉트 후 결과를 가져오는 것은 별도 함수에서 처리
      throw new Error('REDIRECT_INITIATED');
    } else {
      // 팝업 방식 사용
      userCredential = await signInWithPopup(auth, provider);
    }

    const firebaseUser = userCredential.user;

    const user = convertFirebaseUser(firebaseUser);

    // 신규 사용자 설정 처리
    await handleUserLogin(user, firebaseUser, 'Google 로그인');

    return user;
  } catch (error) {
    if (error instanceof Error && error.message === 'REDIRECT_INITIATED') {
      throw error; // 리다이렉트가 시작된 경우는 특별 처리
    }
    const firebaseError = error as FirebaseAuthError;
    // 개발자를 위해 raw error message 전달
    const rawErrorMessage = `Google 로그인 실패 - Code: ${firebaseError.code || 'UNKNOWN'}, Message: ${firebaseError.message || '알 수 없는 오류'}, Type: ${typeof error}`;
    throw new Error(rawErrorMessage);
  }
};

// 리다이렉트 결과 처리
export const handleGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) {
      return null; // 리다이렉트 결과가 없음
    }

    const firebaseUser = result.user;

    const user = convertFirebaseUser(firebaseUser);

    // 신규 사용자 설정 처리
    await handleUserLogin(user, firebaseUser, 'Google 리다이렉트 로그인');

    return user;
  } catch (error) {
    const firebaseError = error as FirebaseAuthError;
    // 개발자를 위해 raw error message 전달
    const rawErrorMessage = `Google 리다이렉트 로그인 실패 - Code: ${firebaseError.code || 'UNKNOWN'}, Message: ${firebaseError.message || '알 수 없는 오류'}, Type: ${typeof error}`;
    throw new Error(rawErrorMessage);
  }
};

// 네이티브 구글 로그인 처리 (idToken만 사용)
export const signInWithNativeGoogle = async (): Promise<User> => {
  return new Promise((resolve, reject) => {
    // 네이티브 앱에 로그인 요청
    postMessageToNative('googleLogin');

    // 메시지 리스너 설정
    const handleNativeMessage = async (message: any) => {
      if (message.type === 'googleLoginSuccess') {
        try {
          const idToken = message.value;
          if (!idToken) {
            throw new Error('네이티브에서 idToken을 받지 못했습니다.');
          }

                     // 1. idToken으로 Firebase Auth 로그인
           const credential = GoogleAuthProvider.credential(idToken);

          const userCredential = await signInWithCredential(auth, credential);
          const firebaseUser = userCredential.user;

          // 2. Firebase User를 앱 User로 변환
          const user = convertFirebaseUser(firebaseUser);

          // 3. 공통 로그인 처리 (firebaseUser 포함)
          await handleUserLogin(user, firebaseUser, '네이티브 Google 로그인');

          resolve(user);
        } catch (error) {
          // 개발자를 위해 raw error message 전달
          const rawErrorMessage = `네이티브 구글 로그인 실패 - ${error instanceof Error ? error.message : String(error)}`;
          reject(new Error(rawErrorMessage));
        }
      } else if (message.type === 'googleLoginFail') {
        // 개발자를 위해 raw error message 전달
        const rawErrorMessage = `네이티브 구글 로그인 실패 - ${message.value || '알 수 없는 오류'}`;
        reject(new Error(rawErrorMessage));
      }
    };

    // 일회성 메시지 리스너 등록
    setWebViewMessageListener(handleNativeMessage);

    // 타임아웃 설정
    setTimeout(() => {
      reject(new Error('네이티브 구글 로그인 타임아웃 - 10초 후 응답 없음'));
    }, 10000);
  });
};

// 기존 사용자들의 빈 문서를 채워주는 마이그레이션 함수
export const migrateAllExistingUsers = async (): Promise<void> => {
  try {
    console.log('=== 기존 사용자 마이그레이션 시작 ===');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('현재 로그인된 사용자가 없어 마이그레이션을 건너뜁니다.');
      return;
    }

    const user = convertFirebaseUser(currentUser);
    
    // 기존 사용자 문서 업데이트 시도
    const wasUpdated = await updateExistingUserDocument(user);
    
    if (wasUpdated) {
      console.log('기존 사용자 문서가 업데이트되었습니다.');
    } else {
      console.log('기존 사용자 문서는 이미 완전합니다.');
    }
    
    console.log('=== 기존 사용자 마이그레이션 완료 ===');
  } catch (error) {
    console.error('기존 사용자 마이그레이션 실패:', error);
    // 마이그레이션 실패는 앱 실행을 막지 않도록 에러를 던지지 않음
  }
};
