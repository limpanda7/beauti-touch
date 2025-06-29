import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { getBrowserLanguage } from './utils/languageUtils';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import ReservationsPage from './pages/ReservationsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import ChartPage from './pages/ChartPage';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import './styles/main.scss';

function App() {
  const { user } = useAuthStore();
  const { language } = useSettingsStore();

  // 사용자 설정에 따른 언어 변경
  useEffect(() => {
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  // 앱 시작 시 브라우저 언어 감지 (사용자가 로그인하지 않은 경우)
  useEffect(() => {
    if (!user && !language) {
      const browserLang = getBrowserLanguage();
      const currentLang = i18n.language;
      
      // 현재 언어가 설정되지 않았거나 브라우저 언어와 다른 경우
      if (!currentLang || currentLang !== browserLang) {
        i18n.changeLanguage(browserLang);
      }
    }
  }, [user, language]);

  return (
    <I18nextProvider i18n={i18n}>
      <div className="app-container">
        <Router>
          <Routes>
            {/* 인증 페이지 */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* 보호된 라우트들 */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/reservations" replace />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="chart/:reservationId" element={<ChartPage />} />
            </Route>
            
            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Router>
      </div>
    </I18nextProvider>
  );
}

export default App;
