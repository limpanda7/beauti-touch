export type ReservationStatus = 'confirmed' | 'completed' | 'noshow' | 'cancelled';

export interface StatusColor {
  background: string;
  text: string;
  border: string;
}

export const getStatusColor = (status: ReservationStatus): StatusColor => {
  switch (status) {
    case 'confirmed':
      return {
        background: '#e3f2fd',
        text: '#1976d2',
        border: '#bbdefb'
      };
    case 'completed':
      return {
        background: '#e8f5e8',
        text: '#2e7d32',
        border: '#c8e6c9'
      };
    case 'noshow':
      return {
        background: '#fff3e0',
        text: '#f57c00',
        border: '#ffcc02'
      };
    case 'cancelled':
      return {
        background: '#ffebee',
        text: '#d32f2f',
        border: '#ffcdd2'
      };
    default:
      return {
        background: '#f5f5f5',
        text: '#757575',
        border: '#e0e0e0'
      };
  }
};

export const getStatusText = (status: ReservationStatus): string => {
  switch (status) {
    case 'confirmed':
      return '확정';
    case 'completed':
      return '차트 작성 완료';
    case 'noshow':
      return '노쇼';
    case 'cancelled':
      return '취소';
    default:
      return '알 수 없음';
  }
}; 