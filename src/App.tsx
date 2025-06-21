import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import ReservationsPage from './pages/ReservationsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import ChartPage from './pages/ChartPage';
import './styles/main.scss';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <SettingsProvider>
        <div className="app-container">
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<ReservationsPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/:id" element={<CustomerDetailPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="chart/:reservationId" element={<ChartPage />} />
              </Route>
            </Routes>
          </Router>
        </div>
      </SettingsProvider>
    </I18nextProvider>
  );
}

export default App;
