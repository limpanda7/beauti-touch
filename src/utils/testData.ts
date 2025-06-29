import { customerService, productService, autoCompleteService } from '../services/firestore';
import { getAuth } from 'firebase/auth';
import type { Customer, Product } from '../types';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const createTestData = async () => {
  try {
    // 사용자 인증 상태 확인
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.log('사용자가 로그인되지 않아 테스트 데이터 생성을 건너뜁니다.');
      return;
    }
    
    console.log('테스트 데이터 생성 시작...');
    
    // 기존 데이터 확인
    const existingCustomers = await customerService.getAll();
    const existingProducts = await productService.getAll();
    
    // 고객 데이터가 없으면 생성
    if (existingCustomers.length === 0) {
      console.log('테스트 고객 데이터 생성 중...');
      await customerService.create({
        name: '김미영',
        phone: '010-1234-5678',
        memo: '첫 방문 고객'
      });
      
      await customerService.create({
        name: '이수진',
        phone: '010-9876-5432',
        memo: '단골 고객'
      });
      
      await customerService.create({
        name: '박지영',
        phone: '010-5555-1234',
        memo: ''
      });
    }
    
    // 상품 데이터가 없으면 생성
    if (existingProducts.length === 0) {
      console.log('테스트 상품 데이터 생성 중...');
      await productService.create({
        name: '기본 네일',
        price: 30000,
        duration: 60,
        description: '기본 네일 시술',
        category: '네일',
        isActive: true
      });
      
      await productService.create({
        name: '젤 네일',
        price: 45000,
        duration: 90,
        description: '젤 네일 시술',
        category: '네일',
        isActive: true
      });
      
      await productService.create({
        name: '속눈썹 연장',
        price: 80000,
        duration: 120,
        description: '속눈썹 연장 시술',
        category: '속눈썹',
        isActive: true
      });
      
      await productService.create({
        name: '아이라인',
        price: 25000,
        duration: 30,
        description: '아이라인 시술',
        category: '메이크업',
        isActive: true
      });
    }
    
    // 자동완성 테스트 데이터 생성
    console.log('자동완성 테스트 데이터 생성 중...');
    await createAutoCompleteTestData();
    
    console.log('테스트 데이터 생성 완료');
  } catch (error) {
    console.error('테스트 데이터 생성 실패:', error);
  }
};

// 자동완성 테스트 데이터 생성
const createAutoCompleteTestData = async () => {
  const testData = [
    // 속눈썹 관련 자동완성 데이터
    { fieldName: 'eyelashMaterial', value: '실크', chartType: 'eyelash' as const },
    { fieldName: 'eyelashMaterial', value: '마인크', chartType: 'eyelash' as const },
    { fieldName: 'eyelashMaterial', value: '캐시미어', chartType: 'eyelash' as const },
    { fieldName: 'eyelashMix', value: 'C 8:10:12', chartType: 'eyelash' as const },
    { fieldName: 'eyelashMix', value: 'D 10:12:14', chartType: 'eyelash' as const },
    { fieldName: 'eyelashGlue', value: '블랙글루', chartType: 'eyelash' as const },
    { fieldName: 'eyelashGlue', value: '클리어글루', chartType: 'eyelash' as const },
    { fieldName: 'eyelashFeedback', value: '자연스럽고 예뻐요', chartType: 'eyelash' as const },
    { fieldName: 'eyelashFeedback', value: '길이 조절 부탁드려요', chartType: 'eyelash' as const },
    
    // 왁싱 관련 자동완성 데이터
    { fieldName: 'waxingArea', value: '눈썹', chartType: 'waxing' as const },
    { fieldName: 'waxingArea', value: '턱선', chartType: 'waxing' as const },
    { fieldName: 'waxingArea', value: '겨드랑이', chartType: 'waxing' as const },
    { fieldName: 'waxingCycle', value: '2주', chartType: 'waxing' as const },
    { fieldName: 'waxingCycle', value: '3주', chartType: 'waxing' as const },
    { fieldName: 'waxingProduct', value: '핫왁스', chartType: 'waxing' as const },
    { fieldName: 'waxingProduct', value: '콜드왁스', chartType: 'waxing' as const },
    { fieldName: 'waxingAftercare', value: '24시간 목욕 금지', chartType: 'waxing' as const },
    { fieldName: 'waxingAftercare', value: '보습제 사용', chartType: 'waxing' as const },
    
    // 네일 관련 자동완성 데이터
    { fieldName: 'nailColor', value: '네이비', chartType: 'nail' as const },
    { fieldName: 'nailColor', value: '로즈골드', chartType: 'nail' as const },
    { fieldName: 'nailColor', value: '블랙', chartType: 'nail' as const },
    { fieldName: 'nailBaseTop', value: '베이스+탑코트', chartType: 'nail' as const },
    { fieldName: 'nailBaseTop', value: '젤베이스+젤탑', chartType: 'nail' as const },
    { fieldName: 'nailFeedback', value: '색상이 예뻐요', chartType: 'nail' as const },
    { fieldName: 'nailFeedback', value: '디자인 부탁드려요', chartType: 'nail' as const },
    
    // 피부관리 관련 자동완성 데이터
    { fieldName: 'skinTypeDetail', value: '건조하고 민감한 피부', chartType: 'skin' as const },
    { fieldName: 'skinTypeDetail', value: '지성 피부, 모공이 큼', chartType: 'skin' as const },
    { fieldName: 'skinPurpose', value: '미백', chartType: 'skin' as const },
    { fieldName: 'skinPurpose', value: '탄력', chartType: 'skin' as const },
    { fieldName: 'skinPurpose', value: '모공 축소', chartType: 'skin' as const },
    { fieldName: 'skinTrouble', value: '여드름', chartType: 'skin' as const },
    { fieldName: 'skinTrouble', value: '기미', chartType: 'skin' as const },
    { fieldName: 'skinTrouble', value: '주근깨', chartType: 'skin' as const },
    { fieldName: 'skinFeedback', value: '피부가 좋아졌어요', chartType: 'skin' as const },
    { fieldName: 'skinFeedback', value: '진정 효과가 좋아요', chartType: 'skin' as const },
    
    // 마사지 관련 자동완성 데이터
    { fieldName: 'massageArea', value: '어깨', chartType: 'massage' as const },
    { fieldName: 'massageArea', value: '등', chartType: 'massage' as const },
    { fieldName: 'massageArea', value: '전신', chartType: 'massage' as const },
    { fieldName: 'massagePreference', value: '따뜻한 오일 사용', chartType: 'massage' as const },
    { fieldName: 'massagePreference', value: '아로마 오일', chartType: 'massage' as const },
    { fieldName: 'massageMuscle', value: '승모근', chartType: 'massage' as const },
    { fieldName: 'massageMuscle', value: '광배근', chartType: 'massage' as const },
  ];

  // 각 테스트 데이터를 여러 번 저장하여 사용 횟수 증가
  for (const data of testData) {
    for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
      await autoCompleteService.saveFieldValue(data.fieldName, data.value, data.chartType);
    }
  }
};

// 테스트 고객 데이터 생성 (마스킹 없이)
export const createTestCustomer = async (): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    const now = new Date();
    const customerId = '0001'; // 테스트용 고정 ID
    
    const testCustomer = {
      id: customerId,
      name: '테스트 고객', // 마스킹하지 않음
      phone: '1234', // 연락처 뒤 4자리만
      memo: '회원가입 시 자동 생성된 테스트 고객입니다.',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };

    // 직접 Firestore에 저장 (마스킹 없이)
    const collectionPath = `users/${user.uid}/customers`;
    const docRef = doc(db, collectionPath, customerId);
    await setDoc(docRef, testCustomer);
    
    console.log('테스트 고객 생성 완료:', customerId);
    return customerId;
  } catch (error) {
    console.error('테스트 고객 생성 실패:', error);
    throw new Error('테스트 고객 생성에 실패했습니다.');
  }
};

// 테스트 상품 데이터 생성
export const createTestProduct = async (): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    const now = new Date();
    const productId = 'test-product-001'; // 테스트용 고정 ID
    
    const testProduct = {
      id: productId,
      name: '테스트 상품',
      price: 50000,
      duration: 60, // 60분
      description: '회원가입 시 자동 생성된 테스트 상품입니다.',
      category: '미정',
      isActive: true,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };

    // 직접 Firestore에 저장
    const collectionPath = `users/${user.uid}/products`;
    const docRef = doc(db, collectionPath, productId);
    await setDoc(docRef, testProduct);
    
    console.log('테스트 상품 생성 완료:', productId);
    return productId;
  } catch (error) {
    console.error('테스트 상품 생성 실패:', error);
    throw new Error('테스트 상품 생성에 실패했습니다.');
  }
};

// 모든 테스트 데이터 생성
export const createAllTestData = async (): Promise<{
  customerId: string;
  productId: string;
}> => {
  try {
    console.log('테스트 데이터 생성 시작...');
    
    // 현재 사용자 확인
    const auth = getAuth();
    const user = auth.currentUser;
    console.log('현재 인증된 사용자:', user?.uid);
    
    if (!user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }
    
    // 테스트 고객과 상품을 병렬로 생성
    console.log('테스트 고객과 상품 생성 시작...');
    const [customerId, productId] = await Promise.all([
      createTestCustomer(),
      createTestProduct()
    ]);

    console.log('모든 테스트 데이터 생성 완료:', { customerId, productId });
    
    return { customerId, productId };
  } catch (error) {
    console.error('테스트 데이터 생성 실패:', error);
    throw new Error('테스트 데이터 생성에 실패했습니다.');
  }
}; 