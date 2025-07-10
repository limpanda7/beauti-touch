export interface Customer {
  id: string; // 4자리 숫자 고객번호 (0000: 회원가입 고객, 0001~9999: 일반 고객)
  name: string; // 마스킹된 이름
  phone: string; // 마스킹된 연락처 (뒤 4자리만)
  memo?: string; // 메모
  // Share Code 관련 필드들
  shareCode?: string; // 공개 접근 코드 (nanoid로 생성)
  sharePassword?: string; // 해시된 비밀번호
  shareEnabled?: boolean; // 공개 접근 활성화 여부
  shareCreatedAt?: Date; // 공개 접근 생성일
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerWithVisitDate extends Customer {
  lastVisit?: Date | null;
  nextVisit?: Date | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  duration: number; // 분 단위
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  date: Date;
  time: string; // HH:mm 형식
  status: 'confirmed' | 'completed' | 'noshow' | 'cancelled';
  price: number;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
  // 차트 정보 (회차별 정보)
  chartType?: ChartType; // 업종(시술 종류)
  chartData?: ChartData; // 업종별 세부 정보
}

export type ChartType = 'eyelash' | 'waxing' | 'nail' | 'skin' | 'massage' | 'pilates' | 'default' | '';

export interface ChartData {
  // 공통 필드
  memo?: string; // 메모(비공개)
  // 속눈썹
  eyelashType?: string;
  eyelashDesign?: string[]; // 체크박스로 변경
  eyelashGlue?: string;
  eyelashMaterial?: string;
  eyelashMix?: string;
  eyelashCurl?: string;
  // 왁싱
  waxingArea?: string;
  waxingSkin?: string;
  waxingProduct?: string;
  waxingCycle?: string;
  waxingHairCondition?: string;
  waxingPain?: string;
  waxingAftercare?: string[]; // 체크박스로 변경
  // 네일
  nailType?: string;
  nailColor?: string;
  nailBaseTop?: string;
  nailCondition?: string;
  nailLength?: string;
  nailArt?: string;
  nailFeedback?: string;
  // 피부관리
  skinType?: 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive' | '';
  skinTypeDetail?: string;
  skinTrouble?: string[];
  skinSensitivity?: string;
  skinPurpose?: string[]; // 체크박스로 변경
  skinProduct?: string;
  // 마사지
  massageArea?: string;
  massageStrength?: string;
  massagePurpose?: string[]; // 체크박스로 변경
  massageMuscle?: string;
  massageOil?: string;
  // 필라테스
  pilatesPurpose?: string[];
  pilatesPosture?: string[];
  pilatesIntensity?: string;
  pilatesPain?: string[];
  pilatesFeedback?: string;
}

/*
export interface ChartCommon {
  visitCycle?: string;
  usedDevice?: string;
  usedProduct?: string;
  caution?: string;
}
*/ 

// 인증 관련 타입들
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  displayName: string;
  confirmPassword: string;
}

// 자동완성 관련 타입들
export interface AutoCompleteData {
  id: string;
  userId: string;
  fieldName: string;
  fieldValue: string;
  chartType: ChartType;
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
}

export interface AutoCompleteSuggestion {
  value: string;
  usageCount: number;
  lastUsed: Date;
}

// Share Code 관련 타입들
export interface ShareCodeData {
  shareCode: string;
  password?: string;
  enabled: boolean;
}

export interface ShareCodeAccess {
  customerId: string;
  shareCode: string;
  password?: string;
}

// 네이티브 구글 로그인 응답 타입
export interface GoogleLoginResponse {
  photo: string;
  givenName: string;
  familyName: string;
  email: string;
  name: string;
  id: string;
  token: string;
}

// 네이티브 구글 로그인 성공 응답 타입 (실제 응답 형식)
export interface NativeGoogleLoginSuccess {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  idToken: string; // Firebase Auth 로그인에 필요한 ID 토큰
}

export interface WebViewGoogleLoginMessage {
  type: 'googleLoginSuccess';
  value: NativeGoogleLoginSuccess;
} 