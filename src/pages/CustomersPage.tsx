import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Customer } from '../types';
import { customerService } from '../services/firestore';
import CustomerModal from '../components/CustomerModal';
import LoadingSpinner from '../components/LoadingSpinner';

const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
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
      const data = await customerService.getAll();
      setCustomers(data);
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
              <th>{t('customers.gender')}</th>
              <th>{t('customers.registrationDate')}</th>
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
                  <td>{customer.gender ? t(`customers.genders.${customer.gender}`) : '-'}</td>
                  <td>
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}
                  </td>
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