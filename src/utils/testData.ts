import { customerService, productService, autoCompleteService } from '../services/firestore';
import { getAuth } from 'firebase/auth';
import type { Customer, Product } from '../types';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import i18n from '../i18n';

// 언어별 테스트 데이터 정의
const getTestDataByLanguage = (language: string) => {
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
      testCustomer: { name: '테스트 고객', phone: '1234', memo: '회원가입 시 자동 생성된 테스트 고객입니다.' },
      testProduct: { name: '테스트 상품', price: 50000, duration: 60, description: '회원가입 시 자동 생성된 테스트 상품입니다.', category: '미정' }
    },
    en: {
      customers: [
        { name: 'Sarah Johnson', phone: '555-123-4567', memo: 'First time customer' },
        { name: 'Michael Brown', phone: '555-987-6543', memo: 'Regular customer' },
        { name: 'Emily Davis', phone: '555-555-1234', memo: '' }
      ],
      products: [
        { name: 'Basic Nail', price: 25, duration: 60, description: 'Basic nail service', category: 'Nail' },
        { name: 'Gel Nail', price: 35, duration: 90, description: 'Gel nail service', category: 'Nail' },
        { name: 'Eyelash Extension', price: 65, duration: 120, description: 'Eyelash extension service', category: 'Eyelash' },
        { name: 'Eyeliner', price: 20, duration: 30, description: 'Eyeliner service', category: 'Makeup' }
      ],
      testCustomer: { name: 'Test Customer', phone: '1234', memo: 'Auto-generated test customer on signup.' },
      testProduct: { name: 'Test Product', price: 40, duration: 60, description: 'Auto-generated test product on signup.', category: 'General' }
    },
    es: {
      customers: [
        { name: 'María García', phone: '555-123-4567', memo: 'Cliente por primera vez' },
        { name: 'Carlos López', phone: '555-987-6543', memo: 'Cliente regular' },
        { name: 'Ana Martínez', phone: '555-555-1234', memo: '' }
      ],
      products: [
        { name: 'Uñas Básicas', price: 20, duration: 60, description: 'Servicio básico de uñas', category: 'Uñas' },
        { name: 'Uñas con Gel', price: 30, duration: 90, description: 'Servicio de uñas con gel', category: 'Uñas' },
        { name: 'Extensión de Pestañas', price: 50, duration: 120, description: 'Servicio de extensión de pestañas', category: 'Pestañas' },
        { name: 'Delineador', price: 15, duration: 30, description: 'Servicio de delineador', category: 'Maquillaje' }
      ],
      testCustomer: { name: 'Cliente de Prueba', phone: '1234', memo: 'Cliente de prueba generado automáticamente al registrarse.' },
      testProduct: { name: 'Producto de Prueba', price: 25, duration: 60, description: 'Producto de prueba generado automáticamente al registrarse.', category: 'General' }
    },
    pt: {
      customers: [
        { name: 'Ana Silva', phone: '555-123-4567', memo: 'Cliente pela primeira vez' },
        { name: 'João Santos', phone: '555-987-6543', memo: 'Cliente regular' },
        { name: 'Maria Costa', phone: '555-555-1234', memo: '' }
      ],
      products: [
        { name: 'Unhas Básicas', price: 25, duration: 60, description: 'Serviço básico de unhas', category: 'Unhas' },
        { name: 'Unhas com Gel', price: 35, duration: 90, description: 'Serviço de unhas com gel', category: 'Unhas' },
        { name: 'Extensão de Cílios', price: 60, duration: 120, description: 'Serviço de extensão de cílios', category: 'Cílios' },
        { name: 'Delineador', price: 20, duration: 30, description: 'Serviço de delineador', category: 'Maquiagem' }
      ],
      testCustomer: { name: 'Cliente de Teste', phone: '1234', memo: 'Cliente de teste gerado automaticamente no cadastro.' },
      testProduct: { name: 'Produto de Teste', price: 30, duration: 60, description: 'Produto de teste gerado automaticamente no cadastro.', category: 'Geral' }
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
      testCustomer: { name: 'ลูกค้าทดสอบ', phone: '1234', memo: 'ลูกค้าทดสอบที่สร้างอัตโนมัติเมื่อสมัครสมาชิก' },
      testProduct: { name: 'สินค้าทดสอบ', price: 1000, duration: 60, description: 'สินค้าทดสอบที่สร้างอัตโนมัติเมื่อสมัครสมาชิก', category: 'ทั่วไป' }
    },
    vi: {
      customers: [
        { name: 'Nguyễn Thị Mai', phone: '090-123-4567', memo: 'Khách hàng lần đầu' },
        { name: 'Trần Văn Nam', phone: '090-987-6543', memo: 'Khách hàng thường xuyên' },
        { name: 'Lê Thị Hoa', phone: '090-555-1234', memo: '' }
      ],
      products: [
        { name: 'Nail Cơ Bản', price: 200000, duration: 60, description: 'Dịch vụ nail cơ bản', category: 'Nail' },
        { name: 'Nail Gel', price: 300000, duration: 90, description: 'Dịch vụ nail gel', category: 'Nail' },
        { name: 'Nối Mi', price: 500000, duration: 120, description: 'Dịch vụ nối mi', category: 'Lông mi' },
        { name: 'Kẻ Mắt', price: 150000, duration: 30, description: 'Dịch vụ kẻ mắt', category: 'Trang điểm' }
      ],
      testCustomer: { name: 'Khách Hàng Test', phone: '1234', memo: 'Khách hàng test được tạo tự động khi đăng ký.' },
      testProduct: { name: 'Sản Phẩm Test', price: 250000, duration: 60, description: 'Sản phẩm test được tạo tự động khi đăng ký.', category: 'Chung' }
    },
    id: {
      customers: [
        { name: 'Sari Wijaya', phone: '081-123-4567', memo: 'Pelanggan pertama kali' },
        { name: 'Budi Santoso', phone: '081-987-6543', memo: 'Pelanggan tetap' },
        { name: 'Dewi Putri', phone: '081-555-1234', memo: '' }
      ],
      products: [
        { name: 'Nail Dasar', price: 150000, duration: 60, description: 'Layanan nail dasar', category: 'Nail' },
        { name: 'Nail Gel', price: 250000, duration: 90, description: 'Layanan nail gel', category: 'Nail' },
        { name: 'Ekstensi Bulu Mata', price: 400000, duration: 120, description: 'Layanan ekstensi bulu mata', category: 'Bulu Mata' },
        { name: 'Eyeliner', price: 100000, duration: 30, description: 'Layanan eyeliner', category: 'Makeup' }
      ],
      testCustomer: { name: 'Pelanggan Test', phone: '1234', memo: 'Pelanggan test yang dibuat otomatis saat mendaftar.' },
      testProduct: { name: 'Produk Test', price: 200000, duration: 60, description: 'Produk test yang dibuat otomatis saat mendaftar.', category: 'Umum' }
    }
  };

  return testData[language as keyof typeof testData] || testData.en;
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
    
    // 고객 데이터가 없으면 생성
    if (existingCustomers.length === 0) {
      console.log('테스트 고객 데이터 생성 중...');
      for (const customer of languageData.customers) {
        await customerService.create(customer);
      }
    }
    
    // 상품 데이터가 없으면 생성
    if (existingProducts.length === 0) {
      console.log('테스트 상품 데이터 생성 중...');
      for (const product of languageData.products) {
        await productService.create({
          ...product,
          isActive: true
        });
      }
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
    const customerId = 'TEST1'; // 테스트용 고정 ID (새로운 형식)
    
    // 현재 언어에 맞는 테스트 데이터 가져오기
    const currentLanguage = i18n.language || 'en';
    const languageData = getTestDataByLanguage(currentLanguage);
    
    const testCustomer = {
      id: customerId,
      name: languageData.testCustomer.name,
      phone: languageData.testCustomer.phone,
      memo: languageData.testCustomer.memo,
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
    
    // 현재 언어에 맞는 테스트 데이터 가져오기
    const currentLanguage = i18n.language || 'en';
    const languageData = getTestDataByLanguage(currentLanguage);
    
    const testProduct = {
      id: productId,
      name: languageData.testProduct.name,
      price: languageData.testProduct.price,
      duration: languageData.testProduct.duration,
      description: languageData.testProduct.description,
      category: languageData.testProduct.category,
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