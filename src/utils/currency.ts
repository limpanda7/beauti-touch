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
    BRL: 'R$',
    MXN: '$',
  };

  return symbols[currency] || '₩';
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