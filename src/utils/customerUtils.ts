// 고객 정보 마스킹 유틸리티

/**
 * 4자리 숫자 고객번호 생성 (Auto Increment)
 * 회원가입 고객: 0000
 * 일반 고객: 0001, 0002, 0003...
 */
export const generateCustomerNumber = (isSignUpCustomer: boolean = false): string => {
  if (isSignUpCustomer) {
    return '0000';
  }
  
  // 일반 고객은 0001부터 시작 (실제로는 Firestore에서 최대값을 조회하여 +1)
  return '0001';
};

/**
 * 고유한 4자리 숫자 고객번호 생성 (중복 확인 포함)
 * @param existingNumbers 기존 고객번호 배열
 * @param isSignUpCustomer 회원가입 고객 여부
 */
export const generateUniqueCustomerNumber = async (
  existingNumbers: string[], 
  isSignUpCustomer: boolean = false
): Promise<string> => {
  if (isSignUpCustomer) {
    return '0000';
  }
  
  // 기존 고객번호 중 숫자만 필터링 (알파벳이 섞여있을 수 있음)
  const numericNumbers = existingNumbers
    .filter(num => /^\d{4}$/.test(num))
    .map(num => parseInt(num))
    .sort((a, b) => a - b);
  
  // 최대 번호 찾기
  const maxNumber = numericNumbers.length > 0 ? Math.max(...numericNumbers) : 0;
  
  // 다음 번호 생성 (최대 9999)
  const nextNumber = Math.min(maxNumber + 1, 9999);
  
  // 4자리 문자열로 변환
  return nextNumber.toString().padStart(4, '0');
};

/**
 * 이름의 언어를 감지하는 함수
 */
const detectNameLanguage = (name: string): 'korean' | 'vietnamese' | 'latin' => {
  if (!name || name.trim().length === 0) return 'latin';
  
  const trimmedName = name.trim();
  
  // 한글 또는 한자 패턴 체크
  // 한글 완성형: \uAC00-\uD7AF (가-힣)
  // 한글 자모: \u1100-\u11FF
  // 한글 호환 자모: \u3130-\u318F
  // 한자: \u4E00-\u9FFF
  const koreanOrChinesePattern = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u4E00-\u9FFF]/;
  
  if (koreanOrChinesePattern.test(trimmedName)) {
    return 'korean';
  }
  
  // 베트남어 성씨 패턴 체크 (Nguyễn, Trần, Lê, Phạm, Hoàng, Huỳnh, Phan, Vũ, Võ, Đặng, Bùi, Đỗ, Hồ, Ngô, Dương, Lý 등)
  const vietnameseSurnames = [
    'nguyễn', 'trần', 'lê', 'phạm', 'hoàng', 'huỳnh', 'phan', 'vũ', 'võ', 'đặng', 
    'bùi', 'đỗ', 'hồ', 'ngô', 'dương', 'lý', 'tạ', 'trịnh', 'đoàn', 'vương', 
    'tăng', 'đinh', 'lâm', 'phùng', 'mai', 'tô', 'hà', 'đặng', 'kiều', 'cao',
    'đinh', 'trương', 'hồng', 'tống', 'châu', 'lưu', 'tạ', 'trịnh', 'đoàn', 'vương'
  ];
  
  const nameParts = trimmedName.toLowerCase().split(/\s+/).filter(part => part.length > 0);
  if (nameParts.length >= 2 && vietnameseSurnames.includes(nameParts[0])) {
    return 'vietnamese';
  }
  
  return 'latin';
};

/**
 * 이름 마스킹 처리 (입력된 이름의 언어를 자동 감지)
 */
export const maskName = (name: string): string => {
  if (!name || name.trim().length === 0) return '';
  
  const trimmedName = name.trim();
  const language = detectNameLanguage(trimmedName);
  
  if (language === 'korean') {
    // 한국어/한자 이름: 가운데 마스킹
    if (trimmedName.length === 1) {
      return '*';
    }
    if (trimmedName.length === 2) {
      return trimmedName[0] + '*';
    }
    // 3글자 이상: 첫글자 + 가운데 마스킹 + 마지막글자
    return trimmedName[0] + '*'.repeat(trimmedName.length - 2) + trimmedName[trimmedName.length - 1];
  } else if (language === 'vietnamese') {
    // 베트남어 이름: 성과 중간 이름 마스킹, 이름만 표시
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
    
    if (nameParts.length === 1) {
      // 단일 이름인 경우 첫글자만 표시
      return nameParts[0][0] + '*'.repeat(nameParts[0].length - 1);
    } else if (nameParts.length >= 2) {
      // 성과 중간 이름은 마스킹, 마지막 이름만 표시
      const lastName = nameParts[nameParts.length - 1];
      return '*'.repeat(3) + ' ' + lastName;
    }
    
    return '*'.repeat(trimmedName.length);
  } else {
    // 영어/라틴글자 이름: first name은 그대로, last name만 마스킹
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
    
    if (nameParts.length === 1) {
      // 단일 이름인 경우 첫글자만 표시
      return nameParts[0][0] + '*'.repeat(nameParts[0].length - 1);
    } else if (nameParts.length >= 2) {
      // 복수 이름인 경우 first name은 그대로, last name만 마스킹
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      const middleNames = nameParts.slice(1, -1);
      
      let result = firstName;
      
      // 중간 이름이 있으면 첫글자만 표시
      if (middleNames.length > 0) {
        result += ' ' + middleNames.map(name => name[0] + '*'.repeat(name.length - 1)).join(' ');
      }
      
      // last name 마스킹
      result += ' ' + lastName[0] + '*'.repeat(lastName.length - 1);
      
      return result;
    }
    
    return '*'.repeat(trimmedName.length);
  }
};

/**
 * 연락처 마스킹 처리 (뒤 4자리만 저장)
 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.trim().length === 0) return '';
  
  const cleanedPhone = phone.replace(/\D/g, ''); // 숫자만 추출
  
  if (cleanedPhone.length <= 4) {
    return cleanedPhone;
  }
  
  // 뒤 4자리만 반환
  return cleanedPhone.slice(-4);
};

/**
 * 고객 데이터 마스킹 처리
 */
export const maskCustomerData = (customerData: any) => {
  return {
    ...customerData,
    name: maskName(customerData.name),
    phone: maskPhone(customerData.phone)
  };
}; 