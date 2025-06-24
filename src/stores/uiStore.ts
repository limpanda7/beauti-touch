import { create } from 'zustand';

interface UIState {
  isMobile: boolean;
  isSidebarOpen: boolean;
  isClosing: boolean;
  isModalOpen: boolean;
}

interface UIActions {
  setIsMobile: (isMobile: boolean) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsClosing: (isClosing: boolean) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  checkScreenSize: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set, get) => ({
  // 초기 상태
  isMobile: false,
  isSidebarOpen: false,
  isClosing: false,
  isModalOpen: false,

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
  }
})); 