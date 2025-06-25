import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Save, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Customer, Reservation } from '../types';
import { customerService, reservationService } from '../services/firestore';
import CustomerModal from '../components/CustomerModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrencyFormat } from '../utils/currency';
import { useSettingsStore } from '../stores/settingsStore';
import { maskCustomerData } from '../utils/customerUtils';

const CustomerDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const { businessType } = useSettingsStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const skinTypeOptions = [
    { value: 'normal', label: t('customers.skinTypes.normal') },
    { value: 'dry', label: t('customers.skinTypes.dry') },
    { value: 'oily', label: t('customers.skinTypes.oily') },
    { value: 'combination', label: t('customers.skinTypes.combination') },
    { value: 'sensitive', label: t('customers.skinTypes.sensitive') },
  ];
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailEdit, setIsDetailEdit] = useState(false);
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailForm, setDetailForm] = useState<Partial<Customer>>({});
  const [originalData, setOriginalData] = useState<Partial<Customer>>({});

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
          memo: customerData.memo || '',
          skinType: customerData.skinType || '',
          allergies: customerData.allergies || '',
          notes: customerData.notes || '',
        });
        setOriginalData({
          name: customerData.name || '',
          phone: customerData.phone || '',
          memo: customerData.memo || '',
          skinType: customerData.skinType || '',
          allergies: customerData.allergies || '',
          notes: customerData.notes || '',
        });
        const reservationData = await reservationService.getByCustomerId(id);
        setReservations(reservationData);
      } else {
        navigate('/customers', { replace: true });
      }
    } catch (error) {
      console.error(t('customers.detailLoadError'), error);
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
  const handleSave = async () => {
    if (!customer) return;

    try {
      setIsDetailSaving(true);
      
      // 상세정보 저장
      const updatedCustomer = {
        ...customer,
        name: detailForm.name || customer.name,
        phone: detailForm.phone || customer.phone,
        memo: detailForm.memo,
        skinType: detailForm.skinType,
        allergies: detailForm.allergies,
        notes: detailForm.notes,
      };

      await customerService.update(customer.id, updatedCustomer);
      setCustomer(updatedCustomer);
      setOriginalData(detailForm);
      setIsDetailEdit(false);
      
      // 성공 메시지 표시
      alert(t('customers.saveSuccess'));
    } catch (e) {
      console.error(t('customers.saveError'), e);
      alert(t('customers.saveError'));
    } finally {
      setIsDetailSaving(false);
    }
  };

  // 상세정보 폼 핸들러
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetailForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailEdit = () => {
    setDetailForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
      memo: customer?.memo || '',
      skinType: customer?.skinType || '',
      allergies: customer?.allergies || '',
      notes: customer?.notes || '',
    });
    setIsDetailEdit(true);
  };

  const handleDetailCancel = () => {
    setDetailForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
      memo: customer?.memo || '',
      skinType: customer?.skinType || '',
      allergies: customer?.allergies || '',
      notes: customer?.notes || '',
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
        console.error(t('customers.deleteError'), error);
        alert(t('customers.deleteError'));
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
    if (status === 'noshow') return t('reservations.statusNoshow');
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
                    onClick={handleSave}
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
            <div className="customer-detail-form-item">
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
            <div className="customer-detail-form-item">
              <label className="customer-detail-label">ID</label>
              <p className="customer-detail-value">
                {customer.id.length === 4 && /^\d{4}$/.test(customer.id) ? customer.id : customer.id.slice(0, 4)}
              </p>
            </div>
            <div className="customer-detail-form-item">
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
                <div 
                  key={reservation.id} 
                  className={`customer-detail-reservation-item ${reservation.status}`}
                >
                  <div>
                    <p className="customer-detail-reservation-date">{format(new Date(reservation.date), 'yyyy.MM.dd (eee)', { locale: ko })} - {reservation.time}</p>
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