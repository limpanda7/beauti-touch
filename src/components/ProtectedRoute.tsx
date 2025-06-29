import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, useIsAuthenticated, useIsInitialized, useIsLoading, useUser } from '../stores/authStore';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useIsInitialized();
  const isLoading = useIsLoading();
  const { initialize } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute - 상태:', { 
      user, 
      isAuthenticated, 
      isInitialized, 
      isLoading, 
      isInitializing 
    });
    
    if (!isInitialized && !isInitializing) {
      console.log('ProtectedRoute - 초기화 시작');
      setIsInitializing(true);
      initialize().finally(() => {
        console.log('ProtectedRoute - 초기화 완료');
        setIsInitializing(false);
      });
    }
  }, [isInitialized, isInitializing, initialize, user, isAuthenticated, isLoading]);

  // 초기화 중이거나 로딩 중일 때 로딩 스피너 표시
  if (!isInitialized || isLoading || isInitializing) {
    console.log('ProtectedRoute - 로딩 중 표시');
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    console.log('ProtectedRoute - 인증되지 않음, 로그인 페이지로 리다이렉트', { isAuthenticated, user });
    return <Navigate to="/auth" replace />;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  console.log('ProtectedRoute - 인증됨, 메인 앱 렌더링', { user });
  return <>{children}</>;
};

export default ProtectedRoute; 