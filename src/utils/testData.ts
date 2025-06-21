import { customerService, productService } from '../services/firestore';

export const createTestData = async () => {
  try {
    // 기존 데이터 확인
    const existingCustomers = await customerService.getAll();
    const existingProducts = await productService.getAll();
    
    // 고객 데이터가 없으면 생성
    if (existingCustomers.length === 0) {
      console.log('테스트 고객 데이터 생성 중...');
      await customerService.create({
        name: '김미영',
        phone: '010-1234-5678',
        email: 'kim@example.com',
        birthDate: '1990-05-15',
        memo: '첫 방문 고객'
      });
      
      await customerService.create({
        name: '이수진',
        phone: '010-9876-5432',
        email: 'lee@example.com',
        birthDate: '1988-12-03',
        memo: '단골 고객'
      });
      
      await customerService.create({
        name: '박지영',
        phone: '010-5555-1234',
        email: 'park@example.com',
        birthDate: '1992-08-22',
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
    
    console.log('테스트 데이터 생성 완료');
  } catch (error) {
    console.error('테스트 데이터 생성 실패:', error);
  }
}; 