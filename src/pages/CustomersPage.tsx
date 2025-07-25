import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Customer, CustomerWithVisitDate } from '../types';
import { customerService, reservationService } from '../services/firestore';
import CustomerModal from '../components/CustomerModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useUIStore } from '../stores/uiStore';

import { formatDate } from '../utils/dateUtils';

const CustomersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { shouldOpenCustomerModal, resetCustomerModal } = useUIStore();
  const [customers, setCustomers] = useState<CustomerWithVisitDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // 플로팅 버튼 클릭 감지
  useEffect(() => {
    if (shouldOpenCustomerModal) {
      handleOpenModal();
      resetCustomerModal();
    }
  }, [shouldOpenCustomerModal, resetCustomerModal]);

  const checkMobileView = () => {
    setIsMobile(window.innerWidth <= 900);
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customerData = await customerService.getAll();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 시간으로 설정

      const processedCustomers = await Promise.all(
        customerData.map(async (customer) => {
          const reservations = await reservationService.getByCustomerId(customer.id);

          const pastReservations = reservations
            .filter(r => {
              const reservationDate = new Date(r.date);
              reservationDate.setHours(0, 0, 0, 0);
              return (r.status === 'confirmed' || r.status === 'completed') && reservationDate < today;
            })
            .sort((a, b) => b.date.getTime() - a.date.getTime());

          const futureReservations = reservations
            .filter(r => {
              const reservationDate = new Date(r.date);
              reservationDate.setHours(0, 0, 0, 0);
              return r.status === 'confirmed' && reservationDate >= today;
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());
          
          return {
            ...customer,
            lastVisit: pastReservations.length > 0 ? pastReservations[0].date : null,
            nextVisit: futureReservations.length > 0 ? futureReservations[0].date : null,
          };
        })
      );
      
      setCustomers(processedCustomers);
    } catch (error) {
      console.error(t('customers.loadError'), error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }, [customers, searchTerm]);
  
  const handleRowClick = (customerId: string) => {
            navigate(`/dashboard/customers/${customerId}`);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    setIsModalOpen(false);
            navigate(`/dashboard/customers/${newCustomer.id}`);
  };

  const renderMobileCustomerCard = (customer: CustomerWithVisitDate) => (
    <div 
      key={customer.id} 
      className="customer-card"
      onClick={() => handleRowClick(customer.id)}
    >
      <div className="customer-card-header">
        <div className="customer-card-name">
          <User className="customer-card-icon" />
          {customer.name}
        </div>
        <div className="customer-card-id">
          {customer.id.length === 4 && /^\d{4}$/.test(customer.id) ? customer.id : customer.id.slice(0, 4)}
        </div>
      </div>
      
      <div className="customer-card-phone">
        <Phone className="customer-card-icon" />
        {customer.phone}
      </div>
      
      <div className="customer-card-visits">
        <div className="customer-card-visit-item">
          <Calendar className="customer-card-icon" />
          <span className="customer-card-visit-label">{t('customers.lastVisit')}:</span>
          <span className="customer-card-visit-date">
            {customer.lastVisit ? formatDate(customer.lastVisit, 'medium', i18n.language) : '-'}
          </span>
        </div>
        <div className="customer-card-visit-item">
          <Calendar className="customer-card-icon" />
          <span className="customer-card-visit-label">{t('customers.nextVisit')}:</span>
          <span className="customer-card-visit-date">
            {customer.nextVisit ? formatDate(customer.nextVisit, 'medium', i18n.language) : '-'}
          </span>
        </div>
      </div>
    </div>
  );

  const renderDesktopTable = () => (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>{t('customers.name')}</th>
          <th>{t('customers.phone')}</th>
          <th>{t('customers.lastVisit')}</th>
          <th>{t('customers.nextVisit')}</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={5} className="customers-table-empty">
              <LoadingSpinner text={t('common.loading')} />
            </td>
          </tr>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <tr key={customer.id} className="customers-table-row-pointer" onClick={() => handleRowClick(customer.id)}>
              <td className="customer-id">
                {customer.id.length === 4 && /^\d{4}$/.test(customer.id) ? customer.id : customer.id.slice(0, 4)}
              </td>
              <td className="name">{customer.name}</td>
              <td>{customer.phone}</td>
              <td>{customer.lastVisit ? formatDate(customer.lastVisit, 'medium', i18n.language) : '-'}</td>
              <td>{customer.nextVisit ? formatDate(customer.nextVisit, 'medium', i18n.language) : '-'}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="customers-table-empty">
              {searchTerm ? t('customers.noSearchResults') : t('customers.noCustomers')}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="content-wrapper customers-page">
      {!isMobile && (
        <div className="page-header">
          <h1>{t('customers.title')}</h1>
          <button
            onClick={handleOpenModal}
            className="btn btn-primary"
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            {t('customers.newCustomer')}
          </button>
        </div>
      )}

      {isMobile && (
        <div className="mobile-search-container">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder={t('customers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      )}

      {!isMobile && (
        <>
          <div className={`search-container ${searchTerm ? 'has-content' : ''}`}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder={t('customers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="table-container">
            {renderDesktopTable()}
          </div>
        </>
      )}

      {isMobile && (
        <div className="customers-mobile-container">
          {loading ? (
            <div className="customers-mobile-empty">
              <LoadingSpinner text={t('common.loading')} />
            </div>
          ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => renderMobileCustomerCard(customer))
          ) : (
            <div className="customers-mobile-empty">
              {searchTerm ? t('customers.noSearchResults') : t('customers.noCustomers')}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <CustomerModal
          customer={null}
          onClose={handleCloseModal}
          onSave={handleCustomerCreated}
        />
      )}
    </div>
  );
};

export default CustomersPage; 