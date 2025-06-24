import { addMinutes, format } from 'date-fns';

/**
 * 시작 시간과 소요 시간(분)을 받아서 시간 범위를 반환합니다.
 * @param startTime - 시작 시간 (HH:mm 형식)
 * @param durationMinutes - 소요 시간 (분)
 * @returns 시간 범위 문자열 (예: "15:00-16:00")
 */
export const getTimeRange = (startTime: string, durationMinutes: number): string => {
  try {
    // 시작 시간을 Date 객체로 변환 (오늘 날짜 기준)
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    // 종료 시간 계산
    const endDate = addMinutes(startDate, durationMinutes);
    
    // 시간 범위 포맷팅
    const startFormatted = format(startDate, 'HH:mm');
    const endFormatted = format(endDate, 'HH:mm');
    
    return `${startFormatted}-${endFormatted}`;
  } catch (error) {
    console.error('시간 범위 계산 오류:', error);
    return startTime; // 오류 시 원래 시간 반환
  }
};

/**
 * 시간을 24시간 형식으로 포맷팅합니다.
 * @param time - 시간 (HH:mm 형식)
 * @returns 포맷팅된 시간
 */
export const formatTime = (time: string): string => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return format(date, 'HH:mm');
  } catch (error) {
    return time;
  }
};

/**
 * 상품 소요시간을 "1h", "30m" 형식으로 포맷팅합니다.
 * @param durationMinutes - 소요 시간 (분)
 * @returns 포맷팅된 시간 문자열 (예: "1h", "30m", "1h 30m")
 */
export const formatDuration = (durationMinutes: number): string => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}; 