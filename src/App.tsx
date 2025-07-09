import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import i18n from './i18n';
import { getBrowserLanguage, getLanguageFromStorage, saveLanguageToStorage } from './utils/languageUtils';
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
import { useSettingsStore } from './stores/settingsStore';
import { isWebViewEnvironment } from './services/webviewBridge';
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
  const { language, isLoading: settingsLoading } = useSettingsStore();

  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('앱 초기화 실패:', error);
      }
    };

    initializeApp();
  }, [initializeAuth]);

  // 언어 설정 우선순위: 계정 언어 > localStorage > 브라우저 언어
  useEffect(() => {
    // 1. 사용자가 로그인되어 있고 계정 언어 설정이 있는 경우
    if (user && language && !settingsLoading) {
      if (language !== i18n.language) {
        i18n.changeLanguage(language);
        saveLanguageToStorage(language as any);
      }
    }
    // 2. 사용자가 로그인되어 있지만 계정 언어 설정이 없는 경우
    else if (user && !language && !settingsLoading) {
      const storedLanguage = getLanguageFromStorage();
      if (storedLanguage && storedLanguage !== i18n.language) {
        i18n.changeLanguage(storedLanguage);
      }
    }
    // 3. 사용자가 로그인되지 않은 경우
    else if (!user) {
      const storedLanguage = getLanguageFromStorage();
      if (storedLanguage && storedLanguage !== i18n.language) {
        i18n.changeLanguage(storedLanguage);
      } else if (!storedLanguage) {
        const browserLang = getBrowserLanguage();
        if (browserLang !== i18n.language) {
          i18n.changeLanguage(browserLang);
          saveLanguageToStorage(browserLang);
        }
      }
    }
  }, [user, language, settingsLoading]);

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
