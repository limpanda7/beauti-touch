import { nanoid } from 'nanoid';
import type { ShareCodeData } from '../types';

// Share Code 생성 (12자리)
export const generateShareCode = (): string => {
  return nanoid(12);
};

// 비밀번호 해시 함수 (간단한 구현, 실제로는 bcrypt 등을 사용해야 함)
export const hashPassword = (password: string): string => {
  // 실제 프로덕션에서는 bcrypt나 다른 안전한 해시 함수를 사용해야 합니다
  return btoa(password); // 임시로 base64 인코딩 사용
};

// 비밀번호 검증 함수
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

// Share Code 데이터 생성
export const createShareCodeData = (password?: string): ShareCodeData => {
  return {
    shareCode: generateShareCode(),
    password: password ? hashPassword(password) : undefined,
    enabled: true
  };
};

// Share Code URL 생성
export const generateShareUrl = (shareCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/share/${shareCode}`;
};

// QR 코드 데이터 URL 생성
export const generateQRCodeDataUrl = (shareCode: string): string => {
  const shareUrl = generateShareUrl(shareCode);
  // QR 코드 라이브러리를 사용하여 데이터 URL 생성
  // 여기서는 간단히 URL만 반환하고, 실제 QR 코드는 컴포넌트에서 생성
  return shareUrl;
}; 