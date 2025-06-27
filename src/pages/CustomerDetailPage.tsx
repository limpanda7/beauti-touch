import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Save, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Customer, Reservation } from '../types';
import { customerService, reservationService } from '../services/firestore';
import CustomerModal from '../components/CustomerModal';
import ReservationModal from '../components/ReservationModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import CustomerInfo from '../components/CustomerInfo';
import { useCurrencyFormat } from '../utils/currency';
import { useSettingsStore } from '../stores/settingsStore';
import { maskCustomerData } from '../utils/customerUtils';

const CustomerDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const { businessType } = useSettingsStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailEdit, setIsDetailEdit] = useState(false);
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailForm, setDetailForm] = useState<Partial<Customer>>({});
  const [originalData, setOriginalData] = useState<Partial<Customer>>({});
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const customerData = await customerService.getById(id);
      if (customerData) {
        // 마스킹된 데이터를 화면에 표시
        setCustomer(customerData);
        
        // 원본 데이터는 별도로 저장 (편집 시 사용)
        // 서버에서 가져온 데이터가 이미 마스킹되어 있으므로, 
        // 원본 데이터는 별도로 관리해야 합니다.
        // 현재는 마스킹된 데이터를 그대로 사용하되, 
        // 편집 시에는 사용자가 입력한 값을 원본으로 간주합니다.
        setDetailForm({
          name: customerData.name || '',
          phone: customerData.phone || '',
          memo: customerData.memo || '',
        });
        setOriginalData({
          name: customerData.name || '',
          phone: customerData.phone || '',
          memo: customerData.memo || '',
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
  
  const handleOpenReservationModal = () => {
    setIsReservationModalOpen(true);
  };
  
  const handleCloseReservationModal = () => {
    setIsReservationModalOpen(false);
  };
  
  const handleSaveReservation = async (savedReservation: Reservation) => {
    handleCloseReservationModal();
    await loadData(); // 예약 목록 새로고침
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
      };

      await customerService.update(customer.id, updatedCustomer);
      
      // 마스킹된 데이터로 화면 업데이트
      const maskedCustomer = {
        ...updatedCustomer,
        name: maskCustomerData(updatedCustomer).name,
        phone: maskCustomerData(updatedCustomer).phone,
      };
      
      setCustomer(maskedCustomer);
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
      name: originalData.name || customer?.name || '',
      phone: originalData.phone || customer?.phone || '',
      memo: originalData.memo || customer?.memo || '',
    });
    setIsDetailEdit(true);
  };

  const handleDetailCancel = () => {
    setDetailForm({
      name: originalData.name || customer?.name || '',
      phone: originalData.phone || customer?.phone || '',
      memo: originalData.memo || customer?.memo || '',
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
    return t(`reservations.status${status.charAt(0).toUpperCase() + status.slice(1)}`);
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
          <Button
            onClick={() => navigate('/customers')}
            variant="icon"
            className="customer-detail-back-icon"
          >
            <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
          </Button>
        </div>
        <div className="customer-detail-header-center">
          <h1 className="customer-detail-title">{customer.name}</h1>
        </div>
      </div>

      <div className="customer-detail-grid">
        <div className="customer-detail-section">
          <div className="customer-detail-section-header">
            <h2 className="customer-detail-section-title">{t('customers.customerInfo')}</h2>
            <div className="customer-detail-btn-group">
              {isDetailEdit ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isDetailSaving}
                    loading={isDetailSaving}
                    variant="primary"
                  >
                    {t('common.save')}
                  </Button>
                  <Button
                    onClick={handleDetailCancel}
                    variant="secondary"
                  >
                    {t('common.cancel')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleDetailEdit}
                    variant="primary"
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    loading={isDeleting}
                    variant="danger"
                  >
                    {t('common.delete')}
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <CustomerInfo
            customer={isDetailEdit ? {
              ...customer,
              name: detailForm.name || customer.name,
              phone: detailForm.phone || customer.phone,
              memo: detailForm.memo || customer.memo,
            } : customer}
            isEdit={isDetailEdit}
            formData={detailForm}
            onFormChange={handleFormChange}
          />
        </div>

        <div className="customer-detail-section">
          <div className="customer-detail-section-header">
            <h2 className="customer-detail-section-title">{t('customers.reservationHistory')}</h2>
            <div className="customer-detail-btn-group">
              <Button
                onClick={handleOpenReservationModal}
                variant="primary"
              >
                <Plus style={{ width: '1rem', height: '1rem' }} />
                {t('reservations.newReservation')}
              </Button>
            </div>
          </div>
          {reservations.length > 0 ? (
            <div className="customer-detail-reservation-list">
              {reservations.map(reservation => (
                <div 
                  key={reservation.id} 
                  className={`customer-detail-reservation-item ${reservation.status}`}
                >
                  <div className="customer-detail-reservation-info">
                    <p className="customer-detail-reservation-date">{format(new Date(reservation.date), 'yyyy.MM.dd (eee)', { locale: ko })} - {reservation.time}</p>
                    <p className="customer-detail-reservation-product">{reservation.productName}</p>
                  </div>
                  <div className="customer-detail-reservation-price">
                    <p className="customer-detail-reservation-price-value">{formatCurrency(reservation.price)}</p>
                    <p className="customer-detail-reservation-status">{reservationStatusLabel(reservation.status)}</p>
                  </div>
                  <div className="customer-detail-reservation-actions">
                    <Button
                      onClick={() => handleChartClick(reservation.id)}
                      variant="chart"
                      size="sm"
                    >
                      <FileText style={{ width: '1rem', height: '1rem' }} />
                      {t('customers.createChart')}
                    </Button>
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
      
      {isReservationModalOpen && customer && (
        <ReservationModal
          reservation={null}
          initialDate={new Date()}
          initialCustomerId={customer.id}
          onClose={handleCloseReservationModal}
          onSave={handleSaveReservation}
          onDelete={async (id: string) => {
            await reservationService.delete(id);
            handleCloseReservationModal();
            await loadData();
          }}
        />
      )}
    </div>
  );
};

export default CustomerDetailPage; 