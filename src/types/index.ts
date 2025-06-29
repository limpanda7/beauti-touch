export interface Customer {
  id: string; // 4자리 고유 ID
  name: string; // 마스킹된 이름
  phone: string; // 마스킹된 연락처 (뒤 4자리만)
  memo?: string; // 메모
  createdAt: Date;
  updatedAt: Date;
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

export type ChartType = 'eyelash' | 'waxing' | 'nail' | 'skin' | 'massage' | 'default' | '';

export interface ChartData {
  // 속눈썹
  eyelashType?: string;
  eyelashMaterial?: string;
  eyelashMix?: string;
  eyelashDesign?: string;
  eyelashGlue?: string;
  eyelashFeedback?: string;
  // 왁싱
  waxingArea?: string;
  waxingCycle?: string;
  waxingSkin?: string;
  waxingProduct?: string;
  waxingPain?: string;
  waxingAftercare?: string;
  // 네일
  nailType?: string;
  nailColor?: string;
  nailBaseTop?: string;
  nailCondition?: string;
  nailFeedback?: string;
  // 피부관리
  skinType?: 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive' | '';
  skinTypeDetail?: string;
  skinPurpose?: string;
  skinTrouble?: string;
  skinSensitivity?: string;
  skinFeedback?: string;
  // 마사지
  massageArea?: string;
  massageStrength?: string;
  massagePreference?: string;
  massageMuscle?: string;
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