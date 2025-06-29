import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import type { Customer, Product, Reservation } from '../types';

// 현재 사용자의 UID를 가져오는 함수
const getCurrentUserId = (): string => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('사용자가 로그인되지 않았습니다.');
  }
  return user.uid;
};

// 사용자별 컬렉션 경로를 생성하는 함수
const getUserCollectionPath = (collectionName: string): string => {
  const userId = getCurrentUserId();
  return `users/${userId}/${collectionName}`;
};

// 데이터 마이그레이션 함수들
export const migrationUtils = {
  // 고객 데이터 마이그레이션
  async migrateCustomers(): Promise<void> {
    try {
      console.log('고객 데이터 마이그레이션 시작...');
      
      // 기존 고객 데이터 가져오기
      const oldCustomersSnapshot = await getDocs(collection(db, 'customers'));
      const oldCustomers = oldCustomersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      
      if (oldCustomers.length === 0) {
        console.log('마이그레이션할 고객 데이터가 없습니다.');
        return;
      }
      
      // 새로운 사용자별 컬렉션에 데이터 복사
      const newCollectionPath = getUserCollectionPath('customers');
      
      for (const customer of oldCustomers) {
        await addDoc(collection(db, newCollectionPath), {
          ...customer,
          migratedAt: new Date()
        });
      }
      
      console.log(`${oldCustomers.length}개의 고객 데이터가 마이그레이션되었습니다.`);
    } catch (error) {
      console.error('고객 데이터 마이그레이션 실패:', error);
      throw error;
    }
  },

  // 상품 데이터 마이그레이션
  async migrateProducts(): Promise<void> {
    try {
      console.log('상품 데이터 마이그레이션 시작...');
      
      // 기존 상품 데이터 가져오기
      const oldProductsSnapshot = await getDocs(collection(db, 'products'));
      const oldProducts = oldProductsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      if (oldProducts.length === 0) {
        console.log('마이그레이션할 상품 데이터가 없습니다.');
        return;
      }
      
      // 새로운 사용자별 컬렉션에 데이터 복사
      const newCollectionPath = getUserCollectionPath('products');
      
      for (const product of oldProducts) {
        await addDoc(collection(db, newCollectionPath), {
          ...product,
          migratedAt: new Date()
        });
      }
      
      console.log(`${oldProducts.length}개의 상품 데이터가 마이그레이션되었습니다.`);
    } catch (error) {
      console.error('상품 데이터 마이그레이션 실패:', error);
      throw error;
    }
  },

  // 예약 데이터 마이그레이션
  async migrateReservations(): Promise<void> {
    try {
      console.log('예약 데이터 마이그레이션 시작...');
      
      // 기존 예약 데이터 가져오기
      const oldReservationsSnapshot = await getDocs(collection(db, 'reservations'));
      const oldReservations = oldReservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
      
      if (oldReservations.length === 0) {
        console.log('마이그레이션할 예약 데이터가 없습니다.');
        return;
      }
      
      // 새로운 사용자별 컬렉션에 데이터 복사
      const newCollectionPath = getUserCollectionPath('reservations');
      
      for (const reservation of oldReservations) {
        await addDoc(collection(db, newCollectionPath), {
          ...reservation,
          migratedAt: new Date()
        });
      }
      
      console.log(`${oldReservations.length}개의 예약 데이터가 마이그레이션되었습니다.`);
    } catch (error) {
      console.error('예약 데이터 마이그레이션 실패:', error);
      throw error;
    }
  },

  // 모든 데이터 마이그레이션
  async migrateAllData(): Promise<void> {
    try {
      console.log('전체 데이터 마이그레이션 시작...');
      
      await this.migrateCustomers();
      await this.migrateProducts();
      await this.migrateReservations();
      
      console.log('모든 데이터 마이그레이션이 완료되었습니다.');
    } catch (error) {
      console.error('전체 데이터 마이그레이션 실패:', error);
      throw error;
    }
  },

  // 기존 데이터 삭제 (마이그레이션 후 사용)
  async cleanupOldData(): Promise<void> {
    try {
      console.log('기존 데이터 정리 시작...');
      
      // 기존 컬렉션들의 모든 문서 삭제
      const collections = ['customers', 'products', 'reservations'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        
        for (const doc of snapshot.docs) {
          await deleteDoc(doc.ref);
        }
        
        console.log(`${collectionName} 컬렉션의 기존 데이터가 삭제되었습니다.`);
      }
      
      console.log('기존 데이터 정리가 완료되었습니다.');
    } catch (error) {
      console.error('기존 데이터 정리 실패:', error);
      throw error;
    }
  }
}; 