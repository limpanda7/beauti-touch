import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import i18n from './i18n';
import { getBrowserLanguage, getLanguageFromStorage, saveLanguageToStorage } from './utils/languageUtils';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import ReservationsPage from './pages/ReservationsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import ChartPage from './pages/ChartPage';
import SharePage from './pages/SharePage';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import './styles/main.scss';

function App() {
  const { user, isInitialized } = useAuthStore();
  const { language, isLoading: settingsLoading } = useSettingsStore();

  // 언어 설정 우선순위: 계정 언어 > localStorage > 브라우저 언어
  useEffect(() => {
    // 1. 사용자가 로그인되어 있고 계정 언어 설정이 있는 경우
    if (user && language && !settingsLoading) {
      if (language !== i18n.language) {
        console.log('계정 언어 설정 적용:', language);
        i18n.changeLanguage(language);
        saveLanguageToStorage(language as any);
      }
    }
    // 2. 사용자가 로그인되어 있지만 계정 언어 설정이 없는 경우
    else if (user && !language && !settingsLoading) {
      const storedLanguage = getLanguageFromStorage();
      if (storedLanguage && storedLanguage !== i18n.language) {
        console.log('localStorage 언어 설정 적용:', storedLanguage);
        i18n.changeLanguage(storedLanguage);
      }
    }
    // 3. 사용자가 로그인되지 않은 경우
    else if (!user) {
      const storedLanguage = getLanguageFromStorage();
      if (storedLanguage && storedLanguage !== i18n.language) {
        console.log('localStorage 언어 설정 적용:', storedLanguage);
        i18n.changeLanguage(storedLanguage);
      } else if (!storedLanguage) {
        const browserLang = getBrowserLanguage();
        if (browserLang !== i18n.language) {
          console.log('브라우저 언어 설정 적용:', browserLang);
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
            <Routes>
              {/* Landing 페이지 (랜딩 페이지) */}
              <Route path="/" element={<LandingPage />} />
              
              {/* 인증 페이지 */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Share Code 페이지 (공개 접근) */}
              <Route path="/share/:shareCode" element={<SharePage />} />
              
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
              
              {/* 기본 리다이렉트 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </div>
      </I18nextProvider>
    </HelmetProvider>
  );
}

export default App;
