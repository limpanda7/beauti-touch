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
        setCustomer(customerData);
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
    });
    setIsDetailEdit(true);
  };

  const handleDetailCancel = () => {
    setDetailForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
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
          
          <div className="customer-detail-table-container">
            <table className="customer-detail-table">
              <tbody>
                <tr className="customer-detail-table-row">
                  <td className="customer-detail-table-label">ID</td>
                  <td className="customer-detail-table-label">{t('customers.name')}</td>
                  <td className="customer-detail-table-label">{t('customers.phone')}</td>
                  <td className="customer-detail-table-label customer-detail-memo-label-desktop">{t('customers.memo')}</td>
                </tr>
                <tr className="customer-detail-table-row">
                  <td className="customer-detail-table-value">
                    {customer.id.length === 4 && /^\d{4}$/.test(customer.id) ? customer.id : customer.id.slice(0, 4)}
                  </td>
                  <td className="customer-detail-table-value">
                    {isDetailEdit ? (
                      <input
                        type="text"
                        name="name"
                        value={detailForm?.name || ''}
                        onChange={handleFormChange}
                        className="customer-detail-table-input"
                      />
                    ) : (
                      <span>{customer.name}</span>
                    )}
                  </td>
                  <td className="customer-detail-table-value">
                    {isDetailEdit ? (
                      <input
                        type="text"
                        name="phone"
                        value={detailForm?.phone || ''}
                        onChange={handleFormChange}
                        className="customer-detail-table-input"
                      />
                    ) : (
                      <span>{customer.phone}</span>
                    )}
                  </td>
                  <td className="customer-detail-table-value customer-detail-memo-value-desktop">
                    {isDetailEdit ? (
                      <textarea
                        name="memo"
                        value={detailForm?.memo || ''}
                        onChange={handleFormChange}
                        className="customer-detail-table-textarea"
                        rows={4}
                      />
                    ) : (
                      <span className="customer-detail-memo-text">{customer.memo || '-'}</span>
                    )}
                  </td>
                </tr>
                {/* 모바일에서 메모를 별도 행으로 표시 */}
                <tr className="customer-detail-table-row customer-detail-memo-row-mobile">
                  <td className="customer-detail-table-label" colSpan={3}>{t('customers.memo')}</td>
                </tr>
                <tr className="customer-detail-table-row customer-detail-memo-row-mobile">
                  <td className="customer-detail-table-value" colSpan={3}>
                    {isDetailEdit ? (
                      <textarea
                        name="memo"
                        value={detailForm?.memo || ''}
                        onChange={handleFormChange}
                        className="customer-detail-table-textarea"
                        rows={4}
                      />
                    ) : (
                      <span className="customer-detail-memo-text">{customer.memo || '-'}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
                    <Button
                      onClick={() => handleChartClick(reservation.id)}
                      variant="chart"
                      size="sm"
                    >
                      <FileText style={{ width: '1rem', height: '1rem' }} />
                      {reservation.chartType ? t('customers.viewChart') : t('customers.createChart')}
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