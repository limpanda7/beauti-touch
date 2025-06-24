import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'user';
  businessId?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface UserActions {
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // 액션들
      setUser: (user) => set({ user }),
      
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      setIsLoading: (isLoading) => set({ isLoading }),
      
      login: (user) => set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      }),
      
      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ 
            user: { ...user, ...updates } 
          });
        }
      }
    }),
    {
      name: 'beauti-touch-user',
      version: 1,
      // 민감한 정보는 제외하고 저장
      partialize: (state) => ({
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          name: state.user.name,
          role: state.user.role,
          businessId: state.user.businessId,
          createdAt: state.user.createdAt,
          lastLoginAt: state.user.lastLoginAt
        } : null,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
); 