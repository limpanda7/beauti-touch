import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import type { User as FirebaseUser, AuthError as FirebaseAuthError } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User, LoginCredentials, SignUpCredentials, AuthError } from '../types';
import { createAllTestData } from '../utils/testData';

// 에러 코드를 한국어 메시지로 변환
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호는 최소 6자 이상이어야 합니다.',
    'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
    'auth/too-many-requests': '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
    'auth/user-disabled': '비활성화된 계정입니다.',
    'auth/operation-not-allowed': '이 작업은 허용되지 않습니다.',
    'auth/invalid-credential': '유효하지 않은 인증 정보입니다.',
    'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
    'auth/popup-blocked': '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.',
    'auth/cancelled-popup-request': '로그인이 취소되었습니다.',
    'auth/account-exists-with-different-credential': '다른 방법으로 가입된 계정입니다.',
    'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',
  };
  
  return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
};

// Firebase User를 앱 User 타입으로 변환
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
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

    // 테스트 데이터 생성 (비동기로 실행하되 에러는 무시)
    try {
      await createAllTestData();
      console.log('회원가입 후 테스트 데이터 생성 완료');
    } catch (testDataError) {
      console.warn('테스트 데이터 생성 실패 (무시됨):', testDataError);
    }

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    
    const firebaseError = error as FirebaseAuthError;
    throw new Error(getErrorMessage(firebaseError.code));
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
    throw new Error(getErrorMessage(firebaseError.code));
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

        // 새 사용자인 경우에만 테스트 데이터 생성
        if (isNewUser && isRecentlyCreated) {
          console.log('인증 상태 변경 - 신규 사용자 감지, 테스트 데이터 생성 시작');
          try {
            const result = await createAllTestData();
            console.log('인증 상태 변경 - 테스트 데이터 생성 완료 (신규 사용자):', result);
          } catch (testDataError) {
            console.error('인증 상태 변경 - 테스트 데이터 생성 실패 (상세):', testDataError);
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

// Google 로그인
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const userCredential = await signInWithPopup(auth, provider);
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

    // 새 사용자인 경우에만 테스트 데이터 생성
    if (isNewUser && isRecentlyCreated) {
      console.log('신규 사용자 감지 - 테스트 데이터 생성 시작');
      try {
        const result = await createAllTestData();
        console.log('Google 로그인 후 테스트 데이터 생성 완료 (신규 사용자):', result);
      } catch (testDataError) {
        console.error('테스트 데이터 생성 실패 (상세):', testDataError);
        console.warn('테스트 데이터 생성 실패 (무시됨):', testDataError);
      }
    } else {
      console.log('기존 사용자 또는 오래된 계정 - 테스트 데이터 생성 건너뜀');
    }

    return user;
  } catch (error) {
    console.error('Google 로그인 실패:', error);
    const firebaseError = error as FirebaseAuthError;
    throw new Error(getErrorMessage(firebaseError.code));
  }
}; 