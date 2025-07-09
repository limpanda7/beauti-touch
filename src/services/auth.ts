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
} from 'firebase/auth';
import type { User as FirebaseUser, AuthError as FirebaseAuthError } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User, LoginCredentials, SignUpCredentials, AuthError, GoogleLoginResponse, NativeGoogleLoginSuccess } from '../types';
import { createAllTestData } from '../utils/testData';
import { getCurrentLanguage } from '../utils/languageUtils';
import { getDefaultCurrencyForLanguage } from '../utils/currency';
import { isWebViewEnvironment } from '../services/webviewBridge';

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
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || undefined,
    photoURL: firebaseUser.photoURL || undefined,
    emailVerified: firebaseUser.emailVerified,
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
  };
};

// 사용자 정보를 Firestore에 저장
const saveUserToFirestore = async (user: User) => {
  try {
    // Firestore에 저장할 데이터 준비 (undefined 값 제거)
    const userData: Record<string, any> = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt.toISOString(),
    };

    // undefined가 아닌 값들만 추가
    if (user.displayName !== undefined) {
      userData.displayName = user.displayName;
    }
    if (user.photoURL !== undefined) {
      userData.photoURL = user.photoURL;
    }

    await setDoc(doc(db, 'users', user.uid), userData);
  } catch (error) {
    console.error('사용자 정보 저장 실패:', error);
  }
};

// 신규 사용자 여부를 확인하는 공통 함수
const checkNewUserStatus = async (user: User, firebaseUser?: any, context: string = 'unknown') => {
  // Firestore에서 기존 사용자 정보 확인
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  const isNewUser = !userDoc.exists();

  // 계정 생성 시간과 현재 시간을 비교하여 신규 사용자 판단
  const creationTime = firebaseUser
    ? new Date(firebaseUser.metadata.creationTime || Date.now())
    : new Date(user.createdAt);
  const currentTime = new Date();
  const timeDiff = currentTime.getTime() - creationTime.getTime();
  const isRecentlyCreated = timeDiff < 60000; // 1분 이내에 생성된 계정

  // 네이티브 로그인의 경우, Firestore 문서가 없거나 생성 시간이 최근인 경우 신규 사용자로 판단
  let shouldCreateTestData = false;

  if (context.includes('네이티브')) {
    // 네이티브 로그인의 경우: 문서가 없거나 생성 시간이 5분 이내인 경우
    shouldCreateTestData = !userDoc.exists() || timeDiff < 300000; // 5분
  } else {
    // 일반 웹 로그인의 경우: 기존 로직 유지
    shouldCreateTestData = isNewUser && isRecentlyCreated;
  }

  return { isNewUser, isRecentlyCreated, shouldCreateTestData };
};

// 신규 사용자를 위한 초기 설정을 처리하는 공통 함수
const handleNewUserSetup = async (user: User, context: string = 'unknown') => {
  try {
    // 언어 설정 저장
    const currentLanguage = getCurrentLanguage();
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
    await setDoc(settingsRef, {
      language: currentLanguage,
      currency: getDefaultCurrencyForLanguage(currentLanguage),
      businessType: ''
    });

    // 테스트 데이터 생성
    try {
      await createAllTestData();
    } catch (testDataError) {
      // 테스트 데이터 생성 실패는 무시
    }
  } catch (error) {
    console.error(`${context} - 신규 사용자 설정 중 오류:`, error);
  }
};

// 사용자 로그인 후 처리를 위한 공통 함수
export const handleUserLogin = async (user: User, firebaseUser?: any, context: string = 'unknown') => {
  try {
    // Firestore에 사용자 정보 저장
    await saveUserToFirestore(user);

    // 신규 사용자 여부 확인
    const { isNewUser, isRecentlyCreated, shouldCreateTestData } = await checkNewUserStatus(user, firebaseUser, context);

    // 테스트 데이터 생성 여부 결정
    if (shouldCreateTestData) {
      await handleNewUserSetup(user, context);
    }
  } catch (error) {
    console.error(`${context} - 사용자 로그인 처리 중 오류:`, error);
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
      emailVerified: firebaseUser.emailVerified,
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
    throw new Error(getErrorTranslationKey(firebaseError.code));
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

    // Firestore에서 사용자 정보 업데이트
    await saveUserToFirestore(user);

    return user;
  } catch (error) {
    console.error('로그인 실패:', error);
    const firebaseError = error as FirebaseAuthError;
    throw new Error(getErrorTranslationKey(firebaseError.code));
  }
};

// 로그아웃
export const signOutUser = async (): Promise<void> => {
  try {
    // 웹뷰 환경에서는 네이티브 로그아웃 사용
    if (isWebViewEnvironment()) {
      return new Promise((resolve, reject) => {
        import('./webviewBridge').then(({ postMessageToNative, setWebViewMessageListener }) => {
          postMessageToNative('googleLogout');

          // 메시지 리스너 설정
          const handleNativeMessage = (message: any) => {
            if (message.type === 'googleLogoutSuccess') {
              resolve();
            } else if (message.type === 'googleLogoutFail') {
              reject(new Error(message.value || '네이티브 로그아웃 실패'));
            }
          };

          // 일회성 메시지 리스너 등록
          setWebViewMessageListener(handleNativeMessage);

          // 타임아웃 설정
          setTimeout(() => {
            reject(new Error('네이티브 로그아웃 타임아웃'));
          }, 5000);
        });
      });
    } else {
      // 웹 환경에서는 Firebase Auth 로그아웃
      await signOut(auth);
    }
  } catch (error) {
    console.error('로그아웃 실패:', error);
    throw new Error('로그아웃 중 오류가 발생했습니다.');
  }
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  const firebaseUser = auth.currentUser;
  return firebaseUser ? convertFirebaseUser(firebaseUser) : null;
};

// 인증 상태 변경 감지
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    console.log('인증 상태 변경 감지:', firebaseUser);
    const user = firebaseUser ? convertFirebaseUser(firebaseUser) : null;
    console.log('변환된 사용자 정보 (상태 변경):', user);

    // 사용자가 있고 신규 사용자인 경우 테스트 데이터 생성
    if (user && firebaseUser) {
      await handleUserLogin(user, firebaseUser, '인증 상태 변경');
    }

    callback(user);
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
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    if (updates.displayName !== undefined) {
      authUpdates.displayName = updates.displayName;
    }
    if (updates.photoURL !== undefined) {
      authUpdates.photoURL = updates.photoURL;
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
    console.error('사용자 정보 업데이트 실패:', error);
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
      console.log('웹뷰 환경에서 네이티브 구글 로그인 요청');
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
      console.log('문제가 있는 브라우저 감지, 리다이렉트 방식 사용');
      // 리다이렉트 방식 사용
      await signInWithRedirect(auth, provider);
      // 리다이렉트 후 결과를 가져오는 것은 별도 함수에서 처리
      throw new Error('REDIRECT_INITIATED');
    } else {
      // 팝업 방식 사용
      userCredential = await signInWithPopup(auth, provider);
    }

    const firebaseUser = userCredential.user;

    console.log('Google 로그인 성공:', firebaseUser);

    const user = convertFirebaseUser(firebaseUser);
    console.log('변환된 사용자 정보:', user);

    // 신규 사용자 설정 처리
    await handleUserLogin(user, firebaseUser, 'Google 로그인');

    return user;
  } catch (error) {
    if (error instanceof Error && error.message === 'REDIRECT_INITIATED') {
      throw error; // 리다이렉트가 시작된 경우는 특별 처리
    }
    console.error('Google 로그인 실패:', error);
    const firebaseError = error as FirebaseAuthError;
    throw new Error(getErrorTranslationKey(firebaseError.code));
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
    console.log('Google 리다이렉트 로그인 성공:', firebaseUser);

    const user = convertFirebaseUser(firebaseUser);
    console.log('변환된 사용자 정보:', user);

    // 신규 사용자 설정 처리
    await handleUserLogin(user, firebaseUser, 'Google 리다이렉트 로그인');

    return user;
  } catch (error) {
    console.error('Google 리다이렉트 결과 처리 실패:', error);
    const firebaseError = error as FirebaseAuthError;
    throw new Error(getErrorTranslationKey(firebaseError.code));
  }
};

// 네이티브 구글 로그인 처리 (idToken만 사용)
export const signInWithNativeGoogle = async (): Promise<User> => {
  return new Promise((resolve, reject) => {
    console.log('=== 네이티브 구글 로그인 처리 시작 ===');

    // 네이티브 앱에 로그인 요청
    import('./webviewBridge').then(({ postMessageToNative }) => {
      postMessageToNative('googleLogin');

      // 메시지 리스너 설정
      const handleNativeMessage = async (message: any) => {
        if (message.type === 'googleLoginSuccess') {
          try {
            const idToken = message.value;
            if (!idToken) {
              throw new Error('네이티브에서 idToken을 받지 못했습니다.');
            }

            console.log('idToken 추출 성공, 길이:', idToken.length);

            // 1. idToken으로 Firebase Auth 로그인
            const { signInWithCredential, GoogleAuthProvider } = await import('firebase/auth');
            const credential = GoogleAuthProvider.credential(idToken);

            const userCredential = await signInWithCredential(auth, credential);
            const firebaseUser = userCredential.user;

            console.log('Firebase Auth 로그인 성공:', firebaseUser);
            console.log('Firebase User UID:', firebaseUser.uid);

            // 2. Firebase User를 앱 User로 변환
            const user = convertFirebaseUser(firebaseUser);
            console.log('변환된 사용자 정보:', user);

            // 3. 공통 로그인 처리 (firebaseUser 포함)
            await handleUserLogin(user, firebaseUser, '네이티브 Google 로그인');

            console.log('=== 네이티브 구글 로그인 처리 완료 ===');
            resolve(user);
          } catch (error) {
            console.error('=== 네이티브 구글 로그인 처리 실패 ===');
            console.error('에러:', error);
            reject(new Error('네이티브 구글 로그인 중 오류가 발생했습니다.'));
          }
        } else if (message.type === 'googleLoginFail') {
          console.error('네이티브 구글 로그인 실패:', message.value);
          reject(new Error(message.value || '네이티브 구글 로그인 실패'));
        }
      };

      // 일회성 메시지 리스너 등록
      import('./webviewBridge').then(({ setWebViewMessageListener }) => {
        setWebViewMessageListener(handleNativeMessage);

        // 타임아웃 설정
        setTimeout(() => {
          reject(new Error('네이티브 구글 로그인 타임아웃'));
        }, 10000);
      });
    });
  });
};
