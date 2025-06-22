import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Save, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Customer, Reservation } from '../types';
import { customerService, reservationService } from '../services/firestore';
import CustomerModal from '../components/CustomerModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrencyFormat } from '../utils/currency';
import { useSettings } from '../contexts/SettingsContext';

const CustomerDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const { settings } = useSettings();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const skinTypeOptions = [
    { value: 'normal', label: t('customers.skinTypes.normal') },
    { value: 'dry', label: t('customers.skinTypes.dry') },
    { value: 'oily', label: t('customers.skinTypes.oily') },
    { value: 'combination', label: t('customers.skinTypes.combination') },
    { value: 'sensitive', label: t('customers.skinTypes.sensitive') },
  ];
  const genderOptions = [
    { value: 'female', label: t('customers.genders.female') },
    { value: 'male', label: t('customers.genders.male') },
    { value: 'other', label: t('customers.genders.other') },
  ];
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailEdit, setIsDetailEdit] = useState(false);
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailForm, setDetailForm] = useState<Partial<Customer>>({});

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const customerData = await customerService.getById(id);
      if (customerData) {
        setCustomer(customerData);
        setDetailForm({
          name: customerData.name || '',
          phone: customerData.phone || '',
          gender: customerData.gender || undefined,
          age: customerData.age || undefined,
          memo: customerData.memo || '',
        });
        const reservationData = await reservationService.getByCustomerId(id);
        setReservations(reservationData);
      } else {
        navigate('/customers', { replace: true });
      }
    } catch (error) {
      console.error('고객 상세 정보를 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const handleSave = (updatedCustomer: Customer) => {
    setCustomer(updatedCustomer);
    setDetailForm((prev: any) => ({ ...prev, ...updatedCustomer }));
    handleCloseModal();
  };

  // 상세정보 폼 핸들러
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetailForm(prev => ({ ...prev, [name]: value }));
  };

  // 상세정보 저장
  const handleDetailSave = async () => {
    if (!customer || !detailForm) return;
    setIsDetailSaving(true);
    try {
      const { id, createdAt, updatedAt, ...updateData } = detailForm;
      await customerService.update(customer.id, updateData);
      const updated = {
        ...customer,
        ...updateData,
      };
      setCustomer(updated);
      setIsDetailEdit(false);
      alert(t('customers.saveSuccess'));
    } catch (e) {
      console.error('고객 정보 저장 실패:', e);
      alert(t('customers.saveError'));
    } finally {
      setIsDetailSaving(false);
    }
  };

  const handleDetailEdit = () => {
    setDetailForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
      gender: customer?.gender || undefined,
      age: customer?.age || undefined,
      memo: customer?.memo || '',
    });
    setIsDetailEdit(true);
  };

  const handleDetailCancel = () => {
    setDetailForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
      gender: customer?.gender || undefined,
      age: customer?.age || undefined,
      memo: customer?.memo || '',
    });
    setIsDetailEdit(false);
  };

  const handleDelete = async () => {
    if (!customer) return;
    
    if (window.confirm(t('customers.deleteConfirm'))) {
      try {
        setIsDeleting(true);
        await customerService.delete(customer.id);
        navigate('/customers');
      } catch (error) {
        console.error('고객 삭제에 실패했습니다:', error);
        alert(t('customers.saveError'));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleChartClick = (reservationId: string) => {
    navigate(`/chart/${reservationId}`);
  };

  // 예약 상태 라벨 다국어 처리 및 상태값 제한
  const reservationStatusLabel = (status: string) => {
    if (status === 'cancelled') return t('reservations.statusCancelled');
    return t('reservations.statusConfirmed');
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <LoadingSpinner fullScreen text={t('common.loading')} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6B7280' }}>
        {t('customers.customerNotFound')}
      </div>
    );
  }

  return (
    <div className="customer-detail-page">
      <div className="customer-detail-header">
        <div className="customer-detail-header-left">
          <button
            onClick={() => navigate('/customers')}
            className="customer-detail-back-icon"
          >
            <ArrowLeft style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>
        <div className="customer-detail-header-center">
          <h1 className="customer-detail-title">{customer.name}</h1>
          <p className="customer-detail-phone">{customer.phone}</p>
        </div>
        <div className="customer-detail-btn-group">
          {/* 버튼들이 여기에서 아래로 이동합니다. */}
        </div>
      </div>

      <div className="customer-detail-grid">
        <div className="customer-detail-section">
          <div className="customer-detail-section-header">
            <h2 className="customer-detail-section-title">{t('customers.customerInfo')}</h2>
            <div className="customer-detail-btn-group">
              {isDetailEdit ? (
                <>
                  <button
                    onClick={handleDetailSave}
                    disabled={isDetailSaving}
                    className="customer-detail-btn customer-detail-btn-save"
                  >
                    <Save style={{ width: '1rem', height: '1rem' }} />
                    {isDetailSaving ? t('common.saving') : t('common.save')}
                  </button>
                  <button
                    onClick={handleDetailCancel}
                    className="customer-detail-btn customer-detail-btn-cancel"
                  >
                    {t('common.cancel')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDetailEdit}
                    className="customer-detail-btn customer-detail-btn-edit"
                  >
                    <Edit style={{ width: '1rem', height: '1rem' }} />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="customer-detail-btn customer-detail-btn-delete"
                  >
                    <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    {isDeleting ? t('common.deleting') : t('common.delete')}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="customer-detail-form">
            <div>
              <label className="customer-detail-label">{t('customers.name')}</label>
              {isDetailEdit ? (
                <input
                  type="text"
                  name="name"
                  value={detailForm?.name || ''}
                  onChange={handleFormChange}
                />
              ) : (
                <p className="customer-detail-value">{customer.name}</p>
              )}
            </div>
            <div>
              <label className="customer-detail-label">{t('customers.phone')}</label>
              {isDetailEdit ? (
                <input
                  type="text"
                  name="phone"
                  value={detailForm?.phone || ''}
                  onChange={handleFormChange}
                />
              ) : (
                <p className="customer-detail-value">{customer.phone}</p>
              )}
            </div>
            <div>
              <label className="customer-detail-label">{t('customers.gender')}</label>
              {isDetailEdit ? (
                <select name="gender" value={detailForm?.gender || ''} onChange={handleFormChange}>
                  {genderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <p className="customer-detail-value">{customer.gender ? t(`customers.genders.${customer.gender}`) : '-'}</p>
              )}
            </div>
            <div>
              <label className="customer-detail-label">{t('customers.age')}</label>
              {isDetailEdit ? (
                <input
                  type="number"
                  name="age"
                  value={detailForm?.age || ''}
                  onChange={handleFormChange}
                />
              ) : (
                <p className="customer-detail-value">{customer.age || '-'}</p>
              )}
            </div>
          </div>
          <div className="customer-detail-memo">
            <label className="customer-detail-label">{t('customers.memo')}</label>
            {isDetailEdit ? (
              <textarea
                name="memo"
                value={detailForm?.memo || ''}
                onChange={handleFormChange}
                rows={4}
              />
            ) : (
              <p className="customer-detail-value memo">{customer.memo || '-'}</p>
            )}
          </div>
        </div>

        <div className="customer-detail-section">
          <h2 className="customer-detail-section-title">{t('customers.reservationHistory')}</h2>
          {reservations.length > 0 ? (
            <div className="customer-detail-reservation-list">
              {reservations.map(reservation => (
                <div key={reservation.id} className="customer-detail-reservation-item">
                  <div>
                    <p className="customer-detail-reservation-date">{new Date(reservation.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} - {reservation.time}</p>
                    <p className="customer-detail-reservation-product">{reservation.productName}</p>
                    {/* 차트 정보 표시 */}
                    {reservation.chartType && (
                      <div className="customer-detail-chart-info">
                        <p className="customer-detail-chart-type">
                          {t(`chart.type.${reservation.chartType}`)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="customer-detail-reservation-price">
                    <p className="customer-detail-reservation-price-value">{formatCurrency(reservation.price)}</p>
                    <p className="customer-detail-reservation-status">{reservationStatusLabel(reservation.status)}</p>
                  </div>
                  <div className="customer-detail-reservation-actions">
                    <button
                      onClick={() => handleChartClick(reservation.id)}
                      className="customer-detail-reservation-action"
                    >
                      <FileText style={{ width: '1rem', height: '1rem' }} />
                      {reservation.chartType ? t('customers.viewChart') : t('customers.createChart')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="customer-detail-no-reservations">{t('customers.noReservations')}</p>
          )}
        </div>
      </div>
      
      {isModalOpen && customer && (
        <CustomerModal
          customer={customer}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default CustomerDetailPage; 