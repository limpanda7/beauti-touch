import { create } from 'zustand';

interface UIState {
  isMobile: boolean;
  isSidebarOpen: boolean;
  isClosing: boolean;
  isModalOpen: boolean;
  // 모달 상태들
  shouldOpenReservationModal: boolean;
  shouldOpenCustomerModal: boolean;
  shouldOpenProductModal: boolean;
}

interface UIActions {
  setIsMobile: (isMobile: boolean) => void;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
  setIsClosing: (isClosing: boolean) => void;
  setIsModalOpen: (isModalOpen: boolean) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  checkScreenSize: () => void;
  // 모달 열기 함수들
  openReservationModal: () => void;
  openCustomerModal: () => void;
  openProductModal: () => void;
  // 모달 상태 리셋 함수들
  resetReservationModal: () => void;
  resetCustomerModal: () => void;
  resetProductModal: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set, get) => ({
  // 초기 상태
  isMobile: false,
  isSidebarOpen: false,
  isClosing: false,
  isModalOpen: false,
  shouldOpenReservationModal: false,
  shouldOpenCustomerModal: false,
  shouldOpenProductModal: false,

  // 액션들
  setIsMobile: (isMobile) => set({ isMobile }),
  
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  
  setIsClosing: (isClosing) => set({ isClosing }),
  
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  
  toggleSidebar: () => {
    const { isSidebarOpen, isClosing } = get();
    
    if (isSidebarOpen) {
      set({ isClosing: true });
      setTimeout(() => {
        set({ isSidebarOpen: false, isClosing: false });
      }, 400);
    } else {
      set({ isSidebarOpen: true });
    }
  },
  
  closeSidebar: () => {
    const { isMobile } = get();
    if (isMobile) {
      set({ isClosing: true });
      setTimeout(() => {
        set({ isSidebarOpen: false, isClosing: false });
      }, 400);
    }
  },
  
  checkScreenSize: () => {
    const isMobile = window.innerWidth < 900;
    const { isSidebarOpen, isClosing } = get();
    
    set({ isMobile });
    
    // 데스크탑에서는 사이드바 자동 닫기
    if (!isMobile && isSidebarOpen) {
      set({ isSidebarOpen: false, isClosing: false });
    }
  },

  // 모달 열기 함수들
  openReservationModal: () => {
    set({ shouldOpenReservationModal: true });
  },

  openCustomerModal: () => {
    set({ shouldOpenCustomerModal: true });
  },

  openProductModal: () => {
    set({ shouldOpenProductModal: true });
  },

  // 모달 상태 리셋 함수들
  resetReservationModal: () => {
    set({ shouldOpenReservationModal: false });
  },

  resetCustomerModal: () => {
    set({ shouldOpenCustomerModal: false });
  },

  resetProductModal: () => {
    set({ shouldOpenProductModal: false });
  }
})); 