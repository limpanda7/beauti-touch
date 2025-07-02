import { customerService, productService, autoCompleteService, reservationService } from '../services/firestore';
import { getAuth } from 'firebase/auth';
import type { Customer, Product } from '../types';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import i18n from '../i18n';

// 테스트 데이터 생성 중복 실행 방지를 위한 플래그
let isCreatingTestData = false;

// 언어별 테스트 데이터 정의
const getTestDataByLanguage = (language: string) => {
  console.log('테스트 데이터 언어 감지:', language);
  
  const testData = {
    ko: {
      customers: [
        { name: '김미영', phone: '010-1234-5678', memo: '첫 방문 고객' },
        { name: '이수진', phone: '010-9876-5432', memo: '단골 고객' },
        { name: '박지영', phone: '010-5555-1234', memo: '' }
      ],
      products: [
        { name: '기본 네일', price: 30000, duration: 60, description: '기본 네일 시술', category: '네일' },
        { name: '젤 네일', price: 45000, duration: 90, description: '젤 네일 시술', category: '네일' },
        { name: '속눈썹 연장', price: 80000, duration: 120, description: '속눈썹 연장 시술', category: '속눈썹' },
        { name: '아이라인', price: 25000, duration: 30, description: '아이라인 시술', category: '메이크업' }
      ],
      testCustomer: { name: '테스트 고객', phone: '1234', memo: '자동 생성된 테스트 고객입니다.' },
      testProduct: { name: '테스트 상품', price: 50000, duration: 60, description: '자동 생성된 테스트 상품입니다.', category: '미정' }
    },
    en: {
      customers: [
        { name: 'Sarah Johnson', phone: '555-123-4567', memo: 'First time customer' },
        { name: 'Michael Brown', phone: '555-987-6543', memo: 'Regular customer' },
        { name: 'Emily Davis', phone: '555-555-1234', memo: '' }
      ],
      products: [
        { name: 'Basic Nail', price: 30, duration: 60, description: 'Basic nail service', category: 'Nail' },
        { name: 'Gel Nail', price: 45, duration: 90, description: 'Gel nail service', category: 'Nail' },
        { name: 'Eyelash Extension', price: 80, duration: 120, description: 'Eyelash extension service', category: 'Eyelash' },
        { name: 'Eyeliner', price: 25, duration: 30, description: 'Eyeliner service', category: 'Makeup' }
      ],
      testCustomer: { name: 'Test Customer', phone: '1234', memo: 'Automatically generated test customer.' },
      testProduct: { name: 'Test Product', price: 50, duration: 60, description: 'Automatically generated test product.', category: 'Undefined' }
    },
    es: {
      customers: [
        { name: 'María García', phone: '555-123-4567', memo: 'Cliente nueva' },
        { name: 'Carlos López', phone: '555-987-6543', memo: 'Cliente regular' },
        { name: 'Ana Martínez', phone: '555-555-1234', memo: '' }
      ],
      products: [
        { name: 'Uña Básica', price: 30, duration: 60, description: 'Servicio de uñas básico', category: 'Uñas' },
        { name: 'Uña de Gel', price: 45, duration: 90, description: 'Servicio de uñas de gel', category: 'Uñas' },
        { name: 'Extensión de Pestañas', price: 80, duration: 120, description: 'Servicio de extensión de pestañas', category: 'Pestañas' },
        { name: 'Delineador', price: 25, duration: 30, description: 'Servicio de delineador', category: 'Maquillaje' }
      ],
      testCustomer: { name: 'Cliente de Prueba', phone: '1234', memo: 'Cliente de prueba generado automáticamente.' },
      testProduct: { name: 'Producto de Prueba', price: 50, duration: 60, description: 'Producto de prueba generado automáticamente.', category: 'Sin Definir' }
    },
    pt: {
      customers: [
        { name: 'Maria Silva', phone: '11-1234-5678', memo: 'Cliente nova' },
        { name: 'João Santos', phone: '11-9876-5432', memo: 'Cliente regular' },
        { name: 'Ana Costa', phone: '11-5555-1234', memo: '' }
      ],
      products: [
        { name: 'Unha Básica', price: 30, duration: 60, description: 'Serviço de unha básico', category: 'Unha' },
        { name: 'Unha de Gel', price: 45, duration: 90, description: 'Serviço de unha de gel', category: 'Unha' },
        { name: 'Extensão de Cílios', price: 80, duration: 120, description: 'Serviço de extensão de cílios', category: 'Cílios' },
        { name: 'Delineador', price: 25, duration: 30, description: 'Serviço de delineador', category: 'Maquiagem' }
      ],
      testCustomer: { name: 'Cliente Teste', phone: '1234', memo: 'Cliente teste gerado automaticamente.' },
      testProduct: { name: 'Produto Teste', price: 50, duration: 60, description: 'Produto teste gerado automaticamente.', category: 'Não Definido' }
    },
    th: {
      customers: [
        { name: 'สมหญิง ใจดี', phone: '081-123-4567', memo: 'ลูกค้าใหม่' },
        { name: 'สมชาย รักดี', phone: '081-987-6543', memo: 'ลูกค้าประจำ' },
        { name: 'สมศรี มั่นคง', phone: '081-555-1234', memo: '' }
      ],
      products: [
        { name: 'เล็บพื้นฐาน', price: 800, duration: 60, description: 'บริการเล็บพื้นฐาน', category: 'เล็บ' },
        { name: 'เล็บเจล', price: 1200, duration: 90, description: 'บริการเล็บเจล', category: 'เล็บ' },
        { name: 'ต่อขนตา', price: 2000, duration: 120, description: 'บริการต่อขนตา', category: 'ขนตา' },
        { name: 'อายไลเนอร์', price: 600, duration: 30, description: 'บริการอายไลเนอร์', category: 'เมคอัพ' }
      ],
      testCustomer: { name: 'ลูกค้าทดสอบ', phone: '1234', memo: 'ลูกค้าทดสอบที่สร้างอัตโนมัติ' },
      testProduct: { name: 'สินค้าทดสอบ', price: 1000, duration: 60, description: 'สินค้าทดสอบที่สร้างอัตโนมัติ', category: 'ไม่ระบุ' }
    },
    vi: {
      customers: [
        { name: 'Nguyễn Thị Mai', phone: '090-123-4567', memo: 'Khách hàng mới' },
        { name: 'Trần Văn Nam', phone: '090-987-6543', memo: 'Khách hàng thường xuyên' },
        { name: 'Lê Thị Hoa', phone: '090-555-1234', memo: '' }
      ],
      products: [
        { name: 'Nail Cơ Bản', price: 300000, duration: 60, description: 'Dịch vụ nail cơ bản', category: 'Nail' },
        { name: 'Nail Gel', price: 450000, duration: 90, description: 'Dịch vụ nail gel', category: 'Nail' },
        { name: 'Nối Mi', price: 800000, duration: 120, description: 'Dịch vụ nối mi', category: 'Mi' },
        { name: 'Kẻ Mắt', price: 250000, duration: 30, description: 'Dịch vụ kẻ mắt', category: 'Trang điểm' }
      ],
      testCustomer: { name: 'Khách Hàng Test', phone: '1234', memo: 'Khách hàng test được tạo tự động.' },
      testProduct: { name: 'Sản Phẩm Test', price: 500000, duration: 60, description: 'Sản phẩm test được tạo tự động.', category: 'Chưa Xác Định' }
    },
    id: {
      customers: [
        { name: 'Siti Nurhaliza', phone: '081-123-4567', memo: 'Pelanggan baru' },
        { name: 'Ahmad Hidayat', phone: '081-987-6543', memo: 'Pelanggan tetap' },
        { name: 'Dewi Sartika', phone: '081-555-1234', memo: '' }
      ],
      products: [
        { name: 'Kuku Dasar', price: 300000, duration: 60, description: 'Layanan kuku dasar', category: 'Kuku' },
        { name: 'Kuku Gel', price: 450000, duration: 90, description: 'Layanan kuku gel', category: 'Kuku' },
        { name: 'Ekstensi Bulu Mata', price: 800000, duration: 120, description: 'Layanan ekstensi bulu mata', category: 'Bulu Mata' },
        { name: 'Eyeliner', price: 250000, duration: 30, description: 'Layanan eyeliner', category: 'Makeup' }
      ],
      testCustomer: { name: 'Pelanggan Test', phone: '1234', memo: 'Pelanggan test yang dibuat otomatis.' },
      testProduct: { name: 'Produk Test', price: 500000, duration: 60, description: 'Produk test yang dibuat otomatis.', category: 'Belum Ditentukan' }
    }
  };

  // 기본값은 영어로 설정
  const defaultData = testData.en;
  
  // 지원하는 언어인지 확인
  if (language && testData[language as keyof typeof testData]) {
    console.log('지원하는 언어 감지됨:', language);
    return testData[language as keyof typeof testData];
  } else {
    console.log('지원하지 않는 언어 또는 언어 미감지, 기본값(영어) 사용:', language);
    return defaultData;
  }
};

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
    
    // 현재 언어 가져오기
    const currentLanguage = i18n.language || 'en';
    const languageData = getTestDataByLanguage(currentLanguage);
    
    // 기존 데이터 확인
    const existingCustomers = await customerService.getAll();
    const existingProducts = await productService.getAll();
    
    // 고객 데이터는 회원가입 시 createTestCustomer()에서 0000번으로 생성됨
    // 일반 테스트 고객들은 제거 (회원가입 시 불필요)
    
    // 테스트 상품 1개만 생성 (첫 번째 상품만)
    if (existingProducts.length === 0) {
      console.log('테스트 상품 데이터 생성 중...');
      const testProduct = languageData.products[0]; // 첫 번째 상품만 사용
      await productService.create({
        ...testProduct,
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

    // 기존 테스트 고객이 있는지 확인
    const existingCustomers = await customerService.getAll();
    const testCustomerExists = existingCustomers.some(customer => 
      customer.id === '0000' ||
      customer.memo === i18n.t('settings.testData.customerMemo')
    );

    if (testCustomerExists) {
      console.log('테스트 고객이 이미 존재합니다. 기존 ID를 반환합니다.');
      const existingTestCustomer = existingCustomers.find(customer => 
        customer.id === '0000' ||
        customer.memo === i18n.t('settings.testData.customerMemo')
      );
      return existingTestCustomer?.id || '0000';
    }

    const now = new Date();
    
    // 현재 언어에 맞는 테스트 데이터 가져오기
    const currentLanguage = i18n.language || 'en';
    console.log('createTestCustomer - 현재 언어:', currentLanguage);
    
    const languageData = getTestDataByLanguage(currentLanguage);
    console.log('createTestCustomer - 선택된 테스트 고객:', languageData.testCustomer);
    
    const testCustomer = {
      name: languageData.testCustomer.name,
      phone: languageData.testCustomer.phone,
      memo: i18n.t('settings.testData.customerMemo'),
    };

    console.log('createTestCustomer - 생성할 고객 데이터:', testCustomer);

    // 회원가입 고객으로 생성 (0000번)
    const customerNumber = await customerService.create(testCustomer, true);
    
    console.log('테스트 고객 생성 완료:', customerNumber);
    return customerNumber;
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

    // 기존 테스트 상품이 있는지 확인
    const existingProducts = await productService.getAll();
    const testProductExists = existingProducts.some(product => 
      product.id === 'test-product-001' ||
      product.description === i18n.t('settings.testData.productDescription')
    );

    if (testProductExists) {
      console.log('테스트 상품이 이미 존재합니다. 기존 ID를 반환합니다.');
      const existingTestProduct = existingProducts.find(product => 
        product.id === 'test-product-001' ||
        product.description === i18n.t('settings.testData.productDescription')
      );
      return existingTestProduct?.id || 'test-product-001';
    }

    const now = new Date();
    const productId = 'test-product-001'; // 테스트용 고정 ID
    
    // 현재 언어에 맞는 테스트 데이터 가져오기
    const currentLanguage = i18n.language || 'en';
    console.log('createTestProduct - 현재 언어:', currentLanguage);
    
    const languageData = getTestDataByLanguage(currentLanguage);
    console.log('createTestProduct - 선택된 테스트 상품:', languageData.testProduct);
    
    const testProduct = {
      id: productId,
      name: languageData.testProduct.name,
      price: languageData.testProduct.price,
      duration: languageData.testProduct.duration,
      description: i18n.t('settings.testData.productDescription'),
      category: languageData.testProduct.category,
      isActive: true,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };

    console.log('createTestProduct - 생성할 상품 데이터:', testProduct);

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

// 테스트 예약 데이터 생성
export const createTestReservation = async (customerId: string, productId: string): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    // 기존 테스트 예약이 있는지 확인
    const existingReservations = await reservationService.getAll();
    const testReservationExists = existingReservations.some(reservation => 
      reservation.memo === i18n.t('settings.testData.reservationMemo')
    );

    if (testReservationExists) {
      console.log('테스트 예약이 이미 존재합니다. 건너뜁니다.');
      return '';
    }

    const now = new Date();
    
    // 현재 시간을 10분 올림 처리
    const currentMinutes = now.getMinutes();
    const roundedMinutes = Math.ceil(currentMinutes / 10) * 10;
    const reservationTime = new Date(now);
    reservationTime.setMinutes(roundedMinutes, 0, 0);
    
    // 시간이 60분을 넘어가면 다음 시간으로 조정
    if (roundedMinutes >= 60) {
      reservationTime.setHours(reservationTime.getHours() + 1);
      reservationTime.setMinutes(0);
    }
    
    // 시간을 HH:mm 형식으로 포맷팅
    const timeString = reservationTime.toTimeString().slice(0, 5);
    
    // 현재 언어에 맞는 테스트 데이터 가져오기
    const currentLanguage = i18n.language || 'en';
    const languageData = getTestDataByLanguage(currentLanguage);
    
    const testReservation = {
      customerId: customerId,
      customerName: languageData.testCustomer.name,
      productId: productId,
      productName: languageData.testProduct.name,
      date: reservationTime,
      time: timeString,
      status: 'confirmed' as const,
      price: languageData.testProduct.price,
      memo: i18n.t('settings.testData.reservationMemo')
    };

    console.log('createTestReservation - 생성할 예약 데이터:', testReservation);

    // 예약 서비스를 통해 저장
    const reservationId = await reservationService.create(testReservation);
    
    console.log('테스트 예약 생성 완료:', reservationId);
    return reservationId;
  } catch (error) {
    console.error('테스트 예약 생성 실패:', error);
    throw new Error('테스트 예약 생성에 실패했습니다.');
  }
};

// 모든 테스트 데이터 생성
export const createAllTestData = async (): Promise<{
  customerId: string;
  productId: string;
  reservationId: string;
}> => {
  // 중복 실행 방지
  if (isCreatingTestData) {
    console.log('=== 테스트 데이터 생성이 이미 진행 중입니다. 건너뜁니다. ===');
    return { customerId: '', productId: '', reservationId: '' };
  }

  try {
    isCreatingTestData = true;
    console.log('=== 테스트 데이터 생성 시작 ===');
    
    // 현재 사용자 확인
    const auth = getAuth();
    const user = auth.currentUser;
    console.log('현재 인증된 사용자:', user?.uid);
    
    if (!user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }
    
    // 현재 언어 확인
    const currentLanguage = i18n.language || 'en';
    console.log('현재 i18n 언어:', currentLanguage);
    console.log('i18n 객체 상태:', {
      language: i18n.language,
      resolvedLanguage: i18n.resolvedLanguage,
      options: i18n.options
    });
    
    // 언어별 테스트 데이터 가져오기
    const languageData = getTestDataByLanguage(currentLanguage);
    console.log('선택된 언어 데이터:', {
      testCustomer: languageData.testCustomer,
      testProduct: languageData.testProduct
    });
    
    // 테스트 고객과 상품을 병렬로 생성
    console.log('테스트 고객과 상품 생성 시작...');
    const [customerId, productId] = await Promise.all([
      createTestCustomer(),
      createTestProduct()
    ]);

    // 테스트 예약 생성
    console.log('테스트 예약 생성 시작...');
    const reservationId = await createTestReservation(customerId, productId);

    console.log('=== 모든 테스트 데이터 생성 완료 ===');
    console.log('생성된 데이터:', { customerId, productId, reservationId });
    
    return { customerId, productId, reservationId: reservationId || '' };
  } catch (error) {
    console.error('=== 테스트 데이터 생성 실패 ===');
    console.error('에러 상세:', error);
    console.error('에러 스택:', error instanceof Error ? error.stack : '스택 정보 없음');
    throw new Error('테스트 데이터 생성에 실패했습니다.');
  } finally {
    isCreatingTestData = false;
  }
}; 