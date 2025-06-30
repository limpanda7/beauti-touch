import { useSettingsStore } from '../stores/settingsStore';

export const formatCurrency = (amount: number, currency: string = 'KRW'): string => {
  const formatters: Record<string, Intl.NumberFormat> = {
    KRW: new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    USD: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    EUR: new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    VND: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    THB: new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    IDR: new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    BRL: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    MXN: new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
  };

  const formatter = formatters[currency] || formatters.KRW;
  return formatter.format(amount);
};

export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    KRW: '₩',
    USD: '$',
    EUR: '€',
    VND: '₫',
    THB: '฿',
    IDR: 'Rp',
    BRL: 'R$',
    MXN: '$',
  };

  return symbols[currency] || '₩';
};

// 언어별 기본 통화 반환
export const getDefaultCurrencyForLanguage = (language: string): string => {
  const languageCurrencyMap: Record<string, string> = {
    ko: 'KRW', // 한국어 - 원화
    en: 'USD', // 영어 - 달러
    vi: 'VND', // 베트남어 - 동
    th: 'THB', // 태국어 - 바트
    id: 'IDR', // 인도네시아어 - 루피아
    es: 'MXN', // 스페인어 - 페소
    pt: 'BRL', // 포르투갈어 - 헤알
  };

  return languageCurrencyMap[language] || 'KRW';
};

// 설정 스토어와 연동하는 훅
export const useCurrencyFormat = () => {
  const { currency } = useSettingsStore();
  
  const formatWithCurrentCurrency = (amount: number): string => {
    return formatCurrency(amount, currency);
  };
  
  const getCurrentCurrencySymbol = (): string => {
    return getCurrencySymbol(currency);
  };
  
  return {
    formatCurrency: formatWithCurrentCurrency,
    getCurrencySymbol: getCurrentCurrencySymbol,
    currentCurrency: currency
  };
}; 