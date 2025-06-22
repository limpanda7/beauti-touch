import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Customer } from '../types';
import { customerService, reservationService } from '../services/firestore';
import CustomerModal from '../components/CustomerModal';
import LoadingSpinner from '../components/LoadingSpinner';

interface CustomerWithVisitDate extends Customer {
  lastVisit?: Date | null;
  nextVisit?: Date | null;
}

const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<CustomerWithVisitDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customerData = await customerService.getAll();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 시간으로 설정
      console.log('오늘 날짜 (시작):', today);

      const processedCustomers = await Promise.all(
        customerData.map(async (customer) => {
          const reservations = await reservationService.getByCustomerId(customer.id);
          
          // 디버깅: 첫 번째 고객의 예약 정보 출력
          if (customer.name === '테스트 고객') {
            console.log('테스트 고객 예약들:', reservations);
            reservations.forEach(res => {
              const reservationDate = new Date(res.date);
              reservationDate.setHours(0, 0, 0, 0);
              console.log(`예약 날짜: ${reservationDate}, 오늘: ${today}, 비교: ${reservationDate < today}`);
            });
          }

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
          
          // 디버깅: 필터링 결과 출력
          if (customer.name === '테스트 고객') {
            console.log('과거 예약:', pastReservations);
            console.log('미래 예약:', futureReservations);
          }
          
          return {
            ...customer,
            lastVisit: pastReservations.length > 0 ? pastReservations[0].date : null,
            nextVisit: futureReservations.length > 0 ? futureReservations[0].date : null,
          };
        })
      );
      
      setCustomers(processedCustomers);
    } catch (error) {
      console.error('고객 목록을 불러오는데 실패했습니다:', error);
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
    navigate(`/customers/${customerId}`);
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
    // 새로 생성된 고객의 상세 페이지로 이동
    navigate(`/customers/${newCustomer.id}`);
  };

  return (
    <div className="content-wrapper">
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

      <div className="table-container">
        <div className="customers-search-bar">
          <div className="customers-search-input-wrapper">
            <Search className="customers-search-icon" />
            <input
              type="text"
              placeholder={t('customers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="customers-search-input"
            />
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>{t('customers.name')}</th>
              <th>{t('customers.phone')}</th>
              <th>{t('customers.lastVisit')}</th>
              <th>{t('customers.nextVisit')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="customers-table-empty">
                  <LoadingSpinner text={t('common.loading')} />
                </td>
              </tr>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id} className="customers-table-row-pointer" onClick={() => handleRowClick(customer.id)}>
                  <td className="name">{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : '-'}</td>
                  <td>{customer.nextVisit ? new Date(customer.nextVisit).toLocaleDateString() : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="customers-table-empty">
                  {searchTerm ? t('customers.noSearchResults') : t('customers.noCustomers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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