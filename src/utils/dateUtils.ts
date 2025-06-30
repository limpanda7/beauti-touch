import { format } from 'date-fns';
import { ko, enUS, es, pt, th, vi, id } from 'date-fns/locale';

// 언어별 날짜 형식 정의
const DATE_FORMATS = {
  ko: {
    short: 'MM.dd',
    medium: 'yyyy.MM.dd',
    long: 'yyyy년 MM월 dd일',
    month: 'yyyy.MM',
    day: 'MM.dd (eee)',
    time: 'HH:mm',
    weekday: 'eee',
    dayNumber: 'd'
  },
  en: {
    short: 'MM/dd',
    medium: 'MM/dd/yyyy',
    long: 'MMMM dd, yyyy',
    month: 'MMMM yyyy',
    day: 'MM/dd (eee)',
    time: 'HH:mm',
    weekday: 'eee',
    dayNumber: 'd'
  },
  es: {
    short: 'dd/MM',
    medium: 'dd/MM/yyyy',
    long: 'dd de MMMM de yyyy',
    month: 'MMMM yyyy',
    day: 'dd/MM (eee)',
    time: 'HH:mm',
    weekday: 'eee',
    dayNumber: 'd'
  },
  pt: {
    short: 'dd/MM',
    medium: 'dd/MM/yyyy',
    long: 'dd de MMMM de yyyy',
    month: 'MMMM yyyy',
    day: 'dd/MM (eee)',
    time: 'HH:mm',
    weekday: 'eee',
    dayNumber: 'd'
  },
  th: {
    short: 'dd/MM',
    medium: 'dd/MM/yyyy',
    long: 'dd MMMM yyyy',
    month: 'MMMM yyyy',
    day: 'dd/MM (eee)',
    time: 'HH:mm',
    weekday: 'eee',
    dayNumber: 'd'
  },
  vi: {
    short: 'dd/MM',
    medium: 'dd/MM/yyyy',
    long: 'dd tháng MM năm yyyy',
    month: 'MM/yyyy',
    day: 'dd/MM (eee)',
    time: 'HH:mm',
    weekday: 'eee',
    dayNumber: 'd'
  },
  id: {
    short: 'dd/MM',
    medium: 'dd/MM/yyyy',
    long: 'dd MMMM yyyy',
    month: 'MMMM yyyy',
    day: 'dd/MM (eee)',
    time: 'HH:mm',
    weekday: 'eee',
    dayNumber: 'd'
  }
};

// 언어별 date-fns 로케일 매핑
const LOCALES = {
  ko,
  en: enUS,
  es,
  pt,
  th,
  vi,
  id
};

/**
 * 현재 언어에 맞는 date-fns 로케일을 반환합니다.
 */
export const getCurrentLocale = (language: string) => {
  return LOCALES[language as keyof typeof LOCALES] || enUS;
};

/**
 * 현재 언어에 맞는 날짜 형식을 반환합니다.
 */
export const getDateFormat = (language: string, formatType: keyof typeof DATE_FORMATS.ko) => {
  const formats = DATE_FORMATS[language as keyof typeof DATE_FORMATS] || DATE_FORMATS.en;
  return formats[formatType];
};

/**
 * 날짜를 현재 언어에 맞게 포맷팅합니다.
 */
export const formatDate = (
  date: Date, 
  formatType: keyof typeof DATE_FORMATS.ko, 
  language: string
): string => {
  const formatString = getDateFormat(language, formatType);
  const locale = getCurrentLocale(language);
  
  return format(date, formatString, { locale });
};

/**
 * 날짜 범위를 현재 언어에 맞게 포맷팅합니다.
 */
export const formatDateRange = (
  startDate: Date, 
  endDate: Date, 
  language: string
): string => {
  const formatString = getDateFormat(language, 'short');
  const locale = getCurrentLocale(language);
  
  const startFormatted = format(startDate, formatString, { locale });
  const endFormatted = format(endDate, formatString, { locale });
  
  return `${startFormatted} - ${endFormatted}`;
};

/**
 * 시간을 현재 언어에 맞게 포맷팅합니다.
 */
export const formatTime = (time: string, language: string): string => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    const formatString = getDateFormat(language, 'time');
    const locale = getCurrentLocale(language);
    
    return format(date, formatString, { locale });
  } catch (error) {
    return time;
  }
};

/**
 * 요일을 현재 언어에 맞게 포맷팅합니다.
 */
export const formatWeekday = (date: Date, language: string): string => {
  const formatString = getDateFormat(language, 'weekday');
  const locale = getCurrentLocale(language);
  
  return format(date, formatString, { locale });
};

/**
 * 날짜 번호를 현재 언어에 맞게 포맷팅합니다.
 */
export const formatDayNumber = (date: Date, language: string): string => {
  const formatString = getDateFormat(language, 'dayNumber');
  const locale = getCurrentLocale(language);
  
  return format(date, formatString, { locale });
}; 