import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import i18n from './i18n';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import ReservationsPage from './pages/ReservationsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import ChartPage from './pages/ChartPage';
import SharePage from './pages/SharePage';
import ShareChartPage from './pages/ShareChartPage';

import { useAuthStore } from './stores/authStore';
import { useLanguageStore } from './stores/languageStore';
import { isWebViewEnvironment } from './services/webviewBridge';
import { migrateAllExistingUsers } from './services/auth';
import './services/webviewBridge'; // 웹뷰 브리지 초기화
import './styles/main.scss';

// 웹뷰 환경에서 로그인된 사용자를 대시보드로 리다이렉트하는 컴포넌트
const WebViewRedirect: React.FC = () => {
  const { user, isInitialized } = useAuthStore();
  const location = useLocation();
  
  useEffect(() => {
    if (isInitialized && user && isWebViewEnvironment()) {
      // 웹뷰 환경에서 로그인된 사용자가 루트 경로나 인증 페이지에 있는 경우 대시보드로 리다이렉트
      if (location.pathname === '/' || location.pathname === '/auth') {
        console.log('웹뷰: 로그인된 사용자 감지, 대시보드로 리다이렉트');
        window.location.href = '/dashboard';
      }
    }
  }, [user, isInitialized, location.pathname]);

  return null;
};

// 메인 라우트 컴포넌트
const AppRoutes: React.FC = () => {
  const { user, isInitialized } = useAuthStore();

  // 초기화가 완료되지 않은 경우 로딩 상태
  if (!isInitialized) {
    return <LoadingSpinner fullScreen={true} />;
  }

  return (
    <>
      <WebViewRedirect />
      <Routes>
        {/* Landing 페이지 (랜딩 페이지) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* 인증 페이지 - 로그인된 사용자는 대시보드로 리다이렉트 */}
        <Route path="/auth" element={
          user ? <Navigate to="/dashboard" replace /> : <AuthPage />
        } />
        
        {/* Share Code 페이지 (공개 접근) */}
        <Route path="/share/:shareCode" element={<SharePage />} />
        <Route path="/share/:shareCode/chart/:reservationId" element={<ShareChartPage />} />
        
        {/* 보호된 라우트들 */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard/reservations" replace />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="chart/:reservationId" element={<ChartPage />} />
        </Route>
        
        {/* 기본 리다이렉트 - 로그인된 사용자는 대시보드로, 그렇지 않으면 랜딩 페이지로 */}
        <Route path="*" element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
        } />
      </Routes>
    </>
  );
};

function App() {
  const { user, isInitialized, initialize: initializeAuth } = useAuthStore();
  const { initializeLanguage } = useLanguageStore();

  // 앱 초기화 (한 번만 실행)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 언어 초기화를 먼저 실행 (i18n과 동기화)
        initializeLanguage();
        await initializeAuth();
      } catch (error) {
        console.error('앱 초기화 실패:', error);
      }
    };

    initializeApp();
  }, [initializeAuth, initializeLanguage]);

  // 사용자 마이그레이션 (로그인된 사용자가 있을 때 자동 실행)
  useEffect(() => {
    const runMigration = async () => {
      if (user && isInitialized) {
        try {
          console.log('=== 앱 시작 시 사용자 마이그레이션 시작 ===');
          await migrateAllExistingUsers();
          console.log('=== 앱 시작 시 사용자 마이그레이션 완료 ===');
        } catch (error) {
          console.error('앱 시작 시 사용자 마이그레이션 실패:', error);
        }
      }
    };

    runMigration();
  }, [user, isInitialized]);

  // 언어 설정은 앱 시작 시 한 번만 초기화하고, 로그아웃 후에는 재초기화하지 않음
  // localStorage의 언어 설정이 유지되도록 함

  return (
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <div className="app-container">
          <Router>
            <AppRoutes />
          </Router>
        </div>
      </I18nextProvider>
    </HelmetProvider>
  );
}

export default App;
