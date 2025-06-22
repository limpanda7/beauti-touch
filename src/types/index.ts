export interface Customer {
  id: string;
  name: string;
  phone: string;
  birthDate?: string;
  age?: number;
  gender?: 'female' | 'male';
  procedures?: CustomerProcedure[];
  contraindications?: string;
  memo?: string;
  photos?: string[]; // 이미지 URL 배열
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProcedure {
  date: string; // ISO 날짜
  description: string; // 시술명/내용
  note?: string; // 비고
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
  status: 'confirmed' | 'completed' | 'cancelled';
  price: number;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
  // 차트 정보 (회차별 정보)
  chartType?: ChartType; // 업종(시술 종류)
  chartData?: ChartData; // 업종별 세부 정보
}

export type ChartType = 'eyelash' | 'waxing' | 'nail' | 'skin' | 'massage' | '';

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