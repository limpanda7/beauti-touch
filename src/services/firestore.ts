import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  onSnapshot,
  limit,
  collectionGroup
} from 'firebase/firestore';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import type { Customer, Product, Reservation, AutoCompleteData, AutoCompleteSuggestion, ChartType } from '../types';
import { generateCustomerNumber, maskCustomerData, generateUniqueCustomerNumber } from '../utils/customerUtils';
import { generateShareCode, hashPassword, verifyPassword } from '../utils/shareCodeUtils';
import { getAuth } from 'firebase/auth';

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

// Firestore 오류 처리를 위한 헬퍼 함수
const handleFirestoreError = (error: any, operation: string) => {
  console.error(`Firestore ${operation} 오류:`, error);
  
  if (error.code === 'permission-denied') {
    throw new Error('데이터베이스 접근 권한이 없습니다.');
  } else if (error.code === 'unavailable') {
    throw new Error('데이터베이스 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
  } else if (error.code === 'deadline-exceeded') {
    throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
  } else {
    throw new Error(`데이터베이스 오류가 발생했습니다: ${error.message}`);
  }
};

// 재시도 로직을 위한 헬퍼 함수
const retryOperation = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Firestore 작업 실패 (${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

// 고객 관리
export const customerService = {
  async getAll(): Promise<Customer[]> {
    const collectionPath = getUserCollectionPath('customers');
    const querySnapshot = await getDocs(collection(db, collectionPath));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Customer[];
  },

  async getById(id: string): Promise<Customer | null> {
    const collectionPath = getUserCollectionPath('customers');
    const docRef = doc(db, collectionPath, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as Customer;
    }
    return null;
  },

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, isSignUpCustomer: boolean = false): Promise<string> {
    try {
      const now = new Date();
      
      // 회원가입 고객(테스트 고객)인 경우 마스킹을 적용하지 않음
      const customerDataToUse = isSignUpCustomer ? customer : maskCustomerData(customer);
      
      // 기존 고객 번호 목록 가져오기
      const existingCustomers = await this.getAll();
      const existingNumbers = existingCustomers.map(c => c.id);
      
      // 고유한 4자리 숫자 고객번호 생성
      const customerNumber = await generateUniqueCustomerNumber(existingNumbers, isSignUpCustomer);
      
      const customerData = {
        ...customerDataToUse,
        id: customerNumber, // 4자리 숫자 고객번호
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };
      
      // undefined 값들을 제거하여 Firestore에 저장
      const cleanData = Object.fromEntries(
        Object.entries(customerData).filter(([_, value]) => value !== undefined)
      );
      
      // 4자리 숫자 고객번호를 문서 ID로 직접 사용
      const collectionPath = getUserCollectionPath('customers');
      const docRef = doc(db, collectionPath, customerNumber);
      await setDoc(docRef, cleanData);
      
      return customerNumber;
    } catch (error) {
      console.error('고객 생성 실패:', error);
      throw new Error('고객 생성에 실패했습니다.');
    }
  },

  async update(id: string, customer: Partial<Customer>): Promise<void> {
    try {
      const collectionPath = getUserCollectionPath('customers');
      const docRef = doc(db, collectionPath, id);
      
      // 회원가입 고객(0000번)인 경우 마스킹을 적용하지 않음
      const isSignUpCustomer = id === '0000';
      const customerDataToUse = isSignUpCustomer ? customer : maskCustomerData(customer);
      
      const updateData = {
        ...customerDataToUse,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      // undefined 값들을 제거하여 Firestore에 저장
      const cleanData: Record<string, any> = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      await updateDoc(docRef, cleanData);
    } catch (error) {
      console.error('고객 업데이트 실패:', error);
      throw new Error('고객 업데이트에 실패했습니다.');
    }
  },

  async delete(id: string): Promise<void> {
    const collectionPath = getUserCollectionPath('customers');
    const docRef = doc(db, collectionPath, id);
    await deleteDoc(docRef);
  }
};

// 상품 관리
export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      return await retryOperation(async () => {
        const collectionPath = getUserCollectionPath('products');
        const querySnapshot = await getDocs(collection(db, collectionPath));
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as Product[];
      });
    } catch (error) {
      handleFirestoreError(error, '상품 목록 조회');
      return [];
    }
  },

  async getActive(): Promise<Product[]> {
    const collectionPath = getUserCollectionPath('products');
    const q = query(
      collection(db, collectionPath),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Product[];
    
    // 클라이언트에서 이름순으로 정렬
    return products.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id: string): Promise<Product | null> {
    const collectionPath = getUserCollectionPath('products');
    const docRef = doc(db, collectionPath, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as Product;
    }
    return null;
  },

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    
    // undefined 값을 필터링하여 Firebase 오류 방지
    const cleanProduct = Object.fromEntries(
      Object.entries(product).filter(([_, value]) => value !== undefined)
    );
    
    const collectionPath = getUserCollectionPath('products');
    const docRef = await addDoc(collection(db, collectionPath), {
      ...cleanProduct,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });
    return docRef.id;
  },

  async update(id: string, product: Partial<Product>): Promise<void> {
    const collectionPath = getUserCollectionPath('products');
    const docRef = doc(db, collectionPath, id);
    
    // undefined 값을 필터링하여 Firebase 오류 방지
    const cleanProduct = Object.fromEntries(
      Object.entries(product).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(docRef, {
      ...cleanProduct,
      updatedAt: Timestamp.fromDate(new Date())
    });
  },

  async delete(id: string): Promise<void> {
    const collectionPath = getUserCollectionPath('products');
    const docRef = doc(db, collectionPath, id);
    await deleteDoc(docRef);
  }
};

// 예약 관리
export const reservationService = {
  async getAll(): Promise<Reservation[]> {
    const collectionPath = getUserCollectionPath('reservations');
    const q = query(collection(db, collectionPath));
    const querySnapshot = await getDocs(q);
    const reservations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Reservation[];
    
    // 클라이언트에서 날짜와 시간순으로 정렬
    return reservations.sort((a, b) => {
      const dateA = a.date.getTime();
      const dateB = b.date.getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // 최신순
      }
      return b.time.localeCompare(a.time);
    });
  },

  async getByDate(date: Date): Promise<Reservation[]> {
    // 날짜를 UTC 기준으로 처리하여 타임존 문제 방지
    const startOfDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999));

    const collectionPath = getUserCollectionPath('reservations');
    const q = query(
      collection(db, collectionPath),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    const querySnapshot = await getDocs(q);
    
    const reservations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Reservation[];

    // 클라이언트에서 시간순으로 정렬
    return reservations.sort((a, b) => a.time.localeCompare(b.time));
  },
  
  async getByDateRange(startDate: Date, endDate: Date): Promise<Reservation[]> {
    // 날짜를 UTC 기준으로 처리하여 타임존 문제 방지
    const utcStartDate = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0));
    const utcEndDate = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999));
    
    const collectionPath = getUserCollectionPath('reservations');
    const q = query(
      collection(db, collectionPath),
      where("date", ">=", Timestamp.fromDate(utcStartDate)),
      where("date", "<=", Timestamp.fromDate(utcEndDate))
    );
    const querySnapshot = await getDocs(q);
    const reservations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Reservation[];
    
    // 클라이언트에서 날짜와 시간순으로 정렬
    return reservations.sort((a, b) => {
      const dateA = a.date.getTime();
      const dateB = b.date.getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return a.time.localeCompare(b.time);
    });
  },

  async getByCustomerId(customerId: string): Promise<Reservation[]> {
    const collectionPath = getUserCollectionPath('reservations');
    const q = query(
      collection(db, collectionPath),
      where('customerId', '==', customerId)
    );
    const querySnapshot = await getDocs(q);
    const reservations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Reservation[];

    // 클라이언트에서 날짜 최신순으로 정렬
    return reservations.sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  async getById(id: string): Promise<Reservation | null> {
    const collectionPath = getUserCollectionPath('reservations');
    const docRef = doc(db, collectionPath, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        date: docSnap.data().date?.toDate(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as Reservation;
    }
    return null;
  },

  async create(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    // 날짜를 UTC 기준으로 저장
    const utcDate = new Date(Date.UTC(
      reservation.date.getFullYear(),
      reservation.date.getMonth(),
      reservation.date.getDate(),
      reservation.date.getHours(),
      reservation.date.getMinutes(),
      reservation.date.getSeconds(),
      reservation.date.getMilliseconds()
    ));
    
    const collectionPath = getUserCollectionPath('reservations');
    const docRef = await addDoc(collection(db, collectionPath), {
      ...reservation,
      date: Timestamp.fromDate(utcDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });
    return docRef.id;
  },

  async update(id: string, reservation: Partial<Reservation>): Promise<void> {
    const collectionPath = getUserCollectionPath('reservations');
    const docRef = doc(db, collectionPath, id);
    const updateData: any = {
      ...reservation,
      updatedAt: Timestamp.fromDate(new Date())
    };
    
    if (reservation.date) {
      // 날짜를 UTC 기준으로 저장
      const utcDate = new Date(Date.UTC(
        reservation.date.getFullYear(),
        reservation.date.getMonth(),
        reservation.date.getDate(),
        reservation.date.getHours(),
        reservation.date.getMinutes(),
        reservation.date.getSeconds(),
        reservation.date.getMilliseconds()
      ));
      updateData.date = Timestamp.fromDate(utcDate);
    }
    
    console.log('Firestore 업데이트 시작:', id, updateData);
    
    try {
      await updateDoc(docRef, updateData);
      console.log('Firestore 업데이트 성공:', id);
    } catch (error) {
      console.error('Firestore 업데이트 실패:', id, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    const collectionPath = getUserCollectionPath('reservations');
    const docRef = doc(db, collectionPath, id);
    await deleteDoc(docRef);
  }
};

// 자동완성 관리
export const autoCompleteService = {
  // 특정 필드의 자동완성 제안 가져오기
  async getSuggestions(fieldName: string, chartType: ChartType, limitCount: number = 10): Promise<AutoCompleteSuggestion[]> {
    try {
      const userId = getCurrentUserId();
      const collectionPath = getUserCollectionPath('autocomplete');
      
      // chartType이 'default'이면 모든 업종에서 제안을 가져옴
      const conditions = chartType === 'default' 
        ? [
            where('userId', '==', userId),
            where('fieldName', '==', fieldName)
          ]
        : [
            where('userId', '==', userId),
            where('fieldName', '==', fieldName),
            where('chartType', '==', chartType)
          ];
      
      // 인덱스 오류를 피하기 위해 orderBy를 제거하고 클라이언트에서 정렬
      const q = query(
        collection(db, collectionPath),
        ...conditions,
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const suggestions = querySnapshot.docs.map(doc => ({
        value: doc.data().fieldValue,
        usageCount: doc.data().usageCount,
        lastUsed: doc.data().lastUsed?.toDate()
      })) as AutoCompleteSuggestion[];
      
      // 클라이언트에서 정렬 (사용 횟수 내림차순, 마지막 사용 시간 내림차순)
      suggestions.sort((a, b) => {
        if (a.usageCount !== b.usageCount) {
          return b.usageCount - a.usageCount;
        }
        if (a.lastUsed && b.lastUsed) {
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        }
        return 0;
      });
      
      console.log(`자동완성 제안 조회: ${fieldName} (${chartType})`, suggestions.length, '개');
      return suggestions;
    } catch (error) {
      console.error('자동완성 제안 조회 실패:', error);
      return [];
    }
  },

  // 자동완성 데이터 저장/업데이트
  async saveFieldValue(fieldName: string, fieldValue: string, chartType: ChartType): Promise<void> {
    try {
      const userId = getCurrentUserId();
      const collectionPath = getUserCollectionPath('autocomplete');
      
      // 기존 데이터가 있는지 확인
      const q = query(
        collection(db, collectionPath),
        where('userId', '==', userId),
        where('fieldName', '==', fieldName),
        where('fieldValue', '==', fieldValue),
        where('chartType', '==', chartType)
      );
      
      const querySnapshot = await getDocs(q);
      const now = new Date();
      
      if (querySnapshot.empty) {
        // 새로운 자동완성 데이터 생성
        const newData: Omit<AutoCompleteData, 'id'> = {
          userId,
          fieldName,
          fieldValue,
          chartType,
          usageCount: 1,
          lastUsed: now,
          createdAt: now
        };
        
        await addDoc(collection(db, collectionPath), {
          ...newData,
          lastUsed: Timestamp.fromDate(now),
          createdAt: Timestamp.fromDate(now)
        });
        
        console.log(`새 자동완성 데이터 생성: ${fieldName} = "${fieldValue}" (${chartType})`);
      } else {
        // 기존 데이터 업데이트 (사용 횟수 증가, 마지막 사용 시간 업데이트)
        const docRef = doc(db, collectionPath, querySnapshot.docs[0].id);
        const currentData = querySnapshot.docs[0].data();
        
        await updateDoc(docRef, {
          usageCount: currentData.usageCount + 1,
          lastUsed: Timestamp.fromDate(now)
        });
        
        console.log(`자동완성 데이터 업데이트: ${fieldName} = "${fieldValue}" (${chartType}) - ${currentData.usageCount + 1}회 사용`);
      }
    } catch (error) {
      console.error('자동완성 데이터 저장 실패:', error);
    }
  },

  // 특정 필드의 모든 자동완성 데이터 삭제
  async deleteFieldSuggestions(fieldName: string, chartType: ChartType): Promise<void> {
    try {
      const userId = getCurrentUserId();
      const collectionPath = getUserCollectionPath('autocomplete');
      
      const q = query(
        collection(db, collectionPath),
        where('userId', '==', userId),
        where('fieldName', '==', fieldName),
        where('chartType', '==', chartType)
      );
      
      const querySnapshot = await getDocs(q);
      
      // 배치 삭제
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('자동완성 데이터 삭제 실패:', error);
    }
  }
};

// Share Code 관리
export const shareCodeService = {
  // Share Code로 고객 조회 (공개 접근용)
  async getCustomerByShareCode(shareCode: string): Promise<Customer | null> {
    try {
      // 공개 페이지에서는 collectionGroup으로 모든 유저의 customers에서 검색
      const q = query(
        collectionGroup(db, 'customers'),
        where('shareCode', '==', shareCode)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      const customerData = doc.data();
      
      // shareEnabled 체크
      if (!customerData.shareEnabled) return null;
      
      return {
        id: doc.id,
        ...customerData,
        createdAt: customerData.createdAt?.toDate(),
        updatedAt: customerData.updatedAt?.toDate(),
        shareCreatedAt: customerData.shareCreatedAt?.toDate()
      } as Customer;
    } catch (error) {
      console.error('Share Code로 고객 조회 실패:', error);
      return null;
    }
  },

  // Share Code 생성 및 활성화
  async createShareCode(customerId: string, password?: string): Promise<string> {
    try {
      console.log('Share Code 생성 시작:', { customerId, hasPassword: !!password });
      
      const shareCode = generateShareCode();
      console.log('Share Code 생성됨:', shareCode);
      
      const hashedPassword = password ? hashPassword(password) : undefined;
      const now = new Date();
      
      const collectionPath = getUserCollectionPath('customers');
      const docRef = doc(db, collectionPath, customerId);
      
      const updateData: any = {
        shareCode,
        shareEnabled: true,
        shareCreatedAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };
      
      // undefined 값은 제외하고 저장
      if (hashedPassword !== undefined) {
        updateData.sharePassword = hashedPassword;
      } else {
        // 비밀번호가 없으면 기존 비밀번호를 null로 덮어씀(삭제)
        updateData.sharePassword = null;
      }
      
      console.log('Firestore 업데이트 데이터:', updateData);
      
      await updateDoc(docRef, updateData);
      
      console.log('Share Code 생성 완료:', shareCode);
      return shareCode;
    } catch (error: any) {
      console.error('Share Code 생성 실패:', error);
      console.error('에러 상세:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error('Share Code 생성에 실패했습니다.');
    }
  },

  // Share Code 비활성화
  async disableShareCode(customerId: string): Promise<void> {
    try {
      const collectionPath = getUserCollectionPath('customers');
      const docRef = doc(db, collectionPath, customerId);
      
      await updateDoc(docRef, {
        shareEnabled: false,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Share Code 비활성화 실패:', error);
      throw new Error('Share Code 비활성화에 실패했습니다.');
    }
  },

  // Share Code 재생성
  async regenerateShareCode(customerId: string, password?: string): Promise<string> {
    try {
      const newShareCode = generateShareCode();
      const hashedPassword = password ? hashPassword(password) : undefined;
      const now = new Date();
      
      const collectionPath = getUserCollectionPath('customers');
      const docRef = doc(db, collectionPath, customerId);
      
      const updateData: any = {
        shareCode: newShareCode,
        shareEnabled: true,
        shareCreatedAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };
      
      // undefined 값은 제외하고 저장
      if (hashedPassword !== undefined) {
        updateData.sharePassword = hashedPassword;
      } else {
        // 비밀번호가 없으면 기존 비밀번호를 null로 덮어씀(삭제)
        updateData.sharePassword = null;
      }
      
      await updateDoc(docRef, updateData);
      
      return newShareCode;
    } catch (error) {
      console.error('Share Code 재생성 실패:', error);
      throw new Error('Share Code 재생성에 실패했습니다.');
    }
  },

  // 비밀번호 검증
  async verifySharePassword(shareCode: string, password: string): Promise<boolean> {
    try {
      const customer = await this.getCustomerByShareCode(shareCode);
      if (!customer || !customer.sharePassword) {
        return false;
      }
      
      return verifyPassword(password, customer.sharePassword);
    } catch (error) {
      console.error('Share Code 비밀번호 검증 실패:', error);
      return false;
    }
  }
}; 