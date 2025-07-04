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
import type { User, LoginCredentials, SignUpCredentials, AuthError, GoogleLoginResponse } from '../types';
import { createAllTestData } from '../utils/testData';
import { getCurrentLanguage } from '../utils/languageUtils';
import { getDefaultCurrencyForLanguage } from '../utils/currency';

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

    // Firestore에 사용자 정보 저장
    await saveUserToFirestore(user);

    // 회원가입 시점의 언어 설정 저장 (동기적으로 처리)
    const currentLanguage = getCurrentLanguage();
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
    await setDoc(settingsRef, {
      language: currentLanguage,
      currency: getDefaultCurrencyForLanguage(currentLanguage),
      businessType: ''
    });
    console.log('회원가입 시 언어 설정 저장 완료:', currentLanguage);

    // 테스트 데이터 생성 (비동기로 실행하되 에러는 무시)
    try {
      console.log('=== 회원가입 후 테스트 데이터 생성 시작 ===');
      console.log('현재 사용자 UID:', user.uid);
      console.log('현재 언어 설정:', getCurrentLanguage());
      
      await createAllTestData();
      console.log('=== 회원가입 후 테스트 데이터 생성 완료 ===');
    } catch (testDataError) {
      console.error('=== 회원가입 후 테스트 데이터 생성 실패 ===');
      console.error('에러 상세:', testDataError);
      console.error('에러 스택:', testDataError instanceof Error ? testDataError.stack : '스택 정보 없음');
      console.warn('테스트 데이터 생성 실패 (무시됨):', testDataError);
    }

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
    console.log('Firebase 로그인 성공:', firebaseUser);
    
    const user = convertFirebaseUser(firebaseUser);
    console.log('변환된 사용자 정보:', user);

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
    await signOut(auth);
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
      try {
        // Firestore에서 기존 사용자 정보 확인
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const isNewUser = !userDoc.exists();
        
        // 계정 생성 시간과 현재 시간을 비교하여 신규 사용자 판단
        const creationTime = new Date(firebaseUser.metadata.creationTime || Date.now());
        const currentTime = new Date();
        const timeDiff = currentTime.getTime() - creationTime.getTime();
        const isRecentlyCreated = timeDiff < 60000; // 1분 이내에 생성된 계정
        
        console.log('인증 상태 변경 - 사용자 신규 여부 확인:', { 
          uid: user.uid, 
          isNewUser, 
          docExists: userDoc.exists(),
          creationTime: creationTime.toISOString(),
          timeDiff: timeDiff / 1000 + '초',
          isRecentlyCreated
        });

        // Firestore에 사용자 정보 저장
        await saveUserToFirestore(user);

        // 새 사용자인 경우 언어 설정 저장 (동기적으로 처리)
        if (isNewUser && isRecentlyCreated) {
          const currentLanguage = getCurrentLanguage();
          const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
          await setDoc(settingsRef, {
            language: currentLanguage,
            currency: getDefaultCurrencyForLanguage(currentLanguage),
            businessType: ''
          });
          console.log('인증 상태 변경 - 언어 설정 저장 완료:', currentLanguage);
        }

        // 새 사용자인 경우에만 테스트 데이터 생성
        if (isNewUser && isRecentlyCreated) {
          console.log('=== 인증 상태 변경 - 신규 사용자 감지, 테스트 데이터 생성 시작 ===');
          console.log('사용자 UID:', user.uid);
          console.log('현재 언어 설정:', getCurrentLanguage());
          
          try {
            const result = await createAllTestData();
            console.log('=== 인증 상태 변경 - 테스트 데이터 생성 완료 (신규 사용자) ===');
            console.log('생성 결과:', result);
          } catch (testDataError) {
            console.error('=== 인증 상태 변경 - 테스트 데이터 생성 실패 (상세) ===');
            console.error('에러 상세:', testDataError);
            console.error('에러 스택:', testDataError instanceof Error ? testDataError.stack : '스택 정보 없음');
            console.warn('인증 상태 변경 - 테스트 데이터 생성 실패 (무시됨):', testDataError);
          }
        } else {
          console.log('인증 상태 변경 - 기존 사용자 또는 오래된 계정, 테스트 데이터 생성 건너뜀');
        }
      } catch (error) {
        console.error('인증 상태 변경 - 사용자 정보 처리 중 오류:', error);
      }
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

    // Firestore에서 기존 사용자 정보 확인
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const isNewUser = !userDoc.exists();
    
    // 계정 생성 시간과 현재 시간을 비교하여 신규 사용자 판단
    const creationTime = new Date(firebaseUser.metadata.creationTime || Date.now());
    const currentTime = new Date();
    const timeDiff = currentTime.getTime() - creationTime.getTime();
    const isRecentlyCreated = timeDiff < 60000; // 1분 이내에 생성된 계정
    
    console.log('사용자 신규 여부 확인:', { 
      uid: user.uid, 
      isNewUser, 
      docExists: userDoc.exists(),
      creationTime: creationTime.toISOString(),
      timeDiff: timeDiff / 1000 + '초',
      isRecentlyCreated
    });

    // Firestore에 사용자 정보 저장
    await saveUserToFirestore(user);

    // 새 사용자인 경우 언어 설정 저장 (동기적으로 처리)
    if (isNewUser && isRecentlyCreated) {
      const currentLanguage = getCurrentLanguage();
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
      await setDoc(settingsRef, {
        language: currentLanguage,
        currency: getDefaultCurrencyForLanguage(currentLanguage),
        businessType: ''
      });
      console.log('Google 로그인 시 언어 설정 저장 완료:', currentLanguage);
    }

    // 새 사용자인 경우에만 테스트 데이터 생성
    if (isNewUser && isRecentlyCreated) {
      console.log('=== 인증 상태 변경 - 신규 사용자 감지, 테스트 데이터 생성 시작 ===');
      console.log('사용자 UID:', user.uid);
      console.log('현재 언어 설정:', getCurrentLanguage());
      
      try {
        const result = await createAllTestData();
        console.log('=== 인증 상태 변경 - 테스트 데이터 생성 완료 (신규 사용자) ===');
        console.log('생성 결과:', result);
      } catch (testDataError) {
        console.error('=== 인증 상태 변경 - 테스트 데이터 생성 실패 (상세) ===');
        console.error('에러 상세:', testDataError);
        console.error('에러 스택:', testDataError instanceof Error ? testDataError.stack : '스택 정보 없음');
        console.warn('인증 상태 변경 - 테스트 데이터 생성 실패 (무시됨):', testDataError);
      }
    } else {
      console.log('기존 사용자 또는 오래된 계정 - 테스트 데이터 생성 건너뜀');
    }

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

    // Firestore에서 기존 사용자 정보 확인
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const isNewUser = !userDoc.exists();
    
    // 계정 생성 시간과 현재 시간을 비교하여 신규 사용자 판단
    const creationTime = new Date(firebaseUser.metadata.creationTime || Date.now());
    const currentTime = new Date();
    const timeDiff = currentTime.getTime() - creationTime.getTime();
    const isRecentlyCreated = timeDiff < 60000; // 1분 이내에 생성된 계정
    
    console.log('사용자 신규 여부 확인:', { 
      uid: user.uid, 
      isNewUser, 
      docExists: userDoc.exists(),
      creationTime: creationTime.toISOString(),
      timeDiff: timeDiff / 1000 + '초',
      isRecentlyCreated
    });

    // Firestore에 사용자 정보 저장
    await saveUserToFirestore(user);

    // 새 사용자인 경우 언어 설정 저장 (동기적으로 처리)
    if (isNewUser && isRecentlyCreated) {
      const currentLanguage = getCurrentLanguage();
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
      await setDoc(settingsRef, {
        language: currentLanguage,
        currency: getDefaultCurrencyForLanguage(currentLanguage),
        businessType: ''
      });
      console.log('Google 리다이렉트 로그인 시 언어 설정 저장 완료:', currentLanguage);
    }

    // 새 사용자인 경우에만 테스트 데이터 생성
    if (isNewUser && isRecentlyCreated) {
      console.log('=== Google 리다이렉트 로그인 - 신규 사용자 감지, 테스트 데이터 생성 시작 ===');
      console.log('사용자 UID:', user.uid);
      console.log('현재 언어 설정:', getCurrentLanguage());
      
      try {
        const result = await createAllTestData();
        console.log('=== Google 리다이렉트 로그인 - 테스트 데이터 생성 완료 (신규 사용자) ===');
        console.log('생성 결과:', result);
      } catch (testDataError) {
        console.error('=== Google 리다이렉트 로그인 - 테스트 데이터 생성 실패 (상세) ===');
        console.error('에러 상세:', testDataError);
        console.error('에러 스택:', testDataError instanceof Error ? testDataError.stack : '스택 정보 없음');
        console.warn('Google 리다이렉트 로그인 - 테스트 데이터 생성 실패 (무시됨):', testDataError);
      }
    } else {
      console.log('기존 사용자 또는 오래된 계정 - 테스트 데이터 생성 건너뜀');
    }

    return user;
  } catch (error) {
    console.error('Google 리다이렉트 결과 처리 실패:', error);
    const firebaseError = error as FirebaseAuthError;
    throw new Error(getErrorTranslationKey(firebaseError.code));
  }
};

// 네이티브 구글 로그인 처리
export const signInWithNativeGoogle = async (nativeGoogleResponse: GoogleLoginResponse): Promise<User> => {
  console.log('=== 네이티브 구글 로그인 처리 시작 ===');
  console.log('네이티브 구글 로그인 응답 받음:', nativeGoogleResponse);
  
  try {
    const { token, email, name, photo, givenName, familyName, id } = nativeGoogleResponse;
    
    // 토큰 유효성 검사
    if (!token || token.length < 100) {
      throw new Error('유효하지 않은 구글 로그인 토큰입니다.');
    }
    
    console.log('토큰 길이:', token.length);
    console.log('토큰 시작 부분:', token.substring(0, 50) + '...');
    
    // Google Auth Provider 생성
    const provider = new GoogleAuthProvider();
    console.log('Google Auth Provider 생성 완료');
    
    // Firebase 인증 시작
    console.log('Firebase 인증 시작...');
    const credential = GoogleAuthProvider.credential(token);
    console.log('Credential 생성 완료:', credential);
    
    // 실제 Firebase Auth에 로그인
    const auth = getAuth();
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;
    
    console.log('Firebase Auth 로그인 성공:', firebaseUser.uid);
    
    // User 객체 생성 (Firebase Auth 사용자 정보 기반)
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || email,
      displayName: firebaseUser.displayName || name,
      photoURL: firebaseUser.photoURL || photo,
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : new Date()
    };
    
    console.log('=== 네이티브 구글 로그인 처리 성공 ===');
    console.log('생성된 사용자 정보:', user);
    
    return user;
    
  } catch (error: any) {
    console.error('=== 네이티브 구글 로그인 처리 실패 ===');
    console.error('에러 타입:', typeof error);
    console.error('에러 객체:', error);
    console.error('에러 메시지:', error.message);
    console.error('에러 스택:', error.stack);
    
    // Firebase Auth 에러 코드 확인
    if (error.code) {
      console.error('Firebase Auth 에러 코드:', error.code);
      console.error('Firebase Auth 에러 메시지:', error.message);
      
      // 특정 에러 코드에 대한 처리
      if (error.code === 'auth/invalid-credential') {
        throw new Error('구글 로그인 토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('이미 다른 방법으로 가입된 계정입니다.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('네트워크 연결을 확인해주세요.');
      }
    }
    
    // 일반적인 에러 처리
    if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('구글 로그인 중 오류가 발생했습니다.');
    }
  }
}; 