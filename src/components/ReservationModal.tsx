import React, { useState, useEffect } from 'react';
import { X, UserPlus, ChevronDown, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Customer, Product, Reservation, ChartType } from '../types';
import { customerService, productService, reservationService } from '../services/firestore';
import CustomerModal from './CustomerModal';
import { useCurrencyFormat } from '../utils/currency';

interface ReservationModalProps {
  reservation: Reservation | null;
  initialDate: Date | null;
  initialCustomerId?: string;
  onClose: () => void;
  onSave: (reservation: Reservation, action?: 'close' | 'bookNext') => void;
  onDelete?: (reservationId: string) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ reservation, initialDate, initialCustomerId, onClose, onSave, onDelete }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerId: reservation?.customerId || initialCustomerId || '',
    productId: reservation?.productId || '',
    date: reservation?.date ? format(reservation.date, 'yyyy-MM-dd') : (initialDate ? format(initialDate, 'yyyy-MM-dd') : ''),
    time: reservation?.time || '',
    status: reservation?.status || 'confirmed',
    memo: reservation?.memo || '',
    price: reservation?.price || 0,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amPm, setAmPm] = useState<string>('');
  const [hour, setHour] = useState<string>('');
  const [minute, setMinute] = useState<string>('');

  // 5분 단위 시간 옵션 생성 (AM이 먼저)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerData, productData] = await Promise.all([
          customerService.getAll(),
          productService.getActive()
        ]);
        setCustomers(customerData);
        setProducts(productData);
        if (reservation?.productId) {
          const product = productData.find(p => p.id === reservation.productId);
          setSelectedProduct(product || null);
        }
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      }
    };
    loadData();
  }, [reservation]);

  useEffect(() => {
    if (reservation) {
      setFormData({
        customerId: reservation.customerId || '',
        productId: reservation.productId || '',
        date: reservation.date ? reservation.date.toISOString().split('T')[0] : '',
        time: reservation.time || '',
        status: reservation.status || 'confirmed',
        memo: reservation.memo || '',
        price: reservation.price || 0,
      });
    }
  }, [reservation]);

  useEffect(() => {
    // 기존 예약 수정 시 값 세팅
    if (formData.time) {
      const [h, m] = formData.time.split(':');
      let hNum = parseInt(h, 10);
      let ampm = 'AM';
      if (hNum === 0) {
        setHour('12');
        setAmPm('AM');
      } else if (hNum === 12) {
        setHour('12');
        setAmPm('PM');
      } else if (hNum > 12) {
        setHour((hNum - 12).toString());
        setAmPm('PM');
      } else {
        setHour(hNum.toString());
        setAmPm('AM');
      }
      setMinute(m);
    } else {
      setAmPm('');
      setHour('');
      setMinute('');
    }
  }, [formData.time]);

  useEffect(() => {
    // 세 값이 모두 선택되면 24시간제로 변환하여 formData.time에 저장
    if (amPm && hour && minute) {
      let h = parseInt(hour, 10);
      if (amPm === 'AM') {
        if (h === 12) h = 0;
      } else {
        if (h !== 12) h += 12;
      }
      const timeValue = `${h.toString().padStart(2, '0')}:${minute}`;
      setFormData(prev => ({ ...prev, time: timeValue }));
    }
  }, [amPm, hour, minute]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'productId') {
      const product = products.find(p => p.id === value);
      setSelectedProduct(product || null);
      setFormData(prev => ({ ...prev, price: product?.price || 0 }));
    }
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    setFormData(prev => ({ ...prev, customerId: newCustomer.id }));
    setIsCustomerModalOpen(false);
  };

  const handleDelete = async () => {
    if (!reservation || !onDelete) return;
    
    if (!confirm(t('reservations.deleteConfirm'))) {
      return;
    }

    setLoading(true);
    try {
      await onDelete(reservation.id);
      onClose();
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      alert(t('reservations.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChartClick = () => {
    if (reservation) {
      navigate(`/chart/${reservation.id}`);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveReservation();
  };

  const saveReservation = async () => {
    setLoading(true);
    try {
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      const selectedProduct = products.find(p => p.id === formData.productId);

      if (!selectedCustomer || !selectedProduct) {
        alert(t('reservations.selectCustomerAndProduct'));
        setLoading(false);
        return;
      }

      // 시간 입력 검증
      if (!formData.time || formData.time.trim() === '') {
        alert(t('reservations.timeRequired'));
        setLoading(false);
        return;
      }

      const reservationData = {
        customerId: formData.customerId,
        customerName: selectedCustomer.name,
        productId: formData.productId,
        productName: selectedProduct.name,
        price: formData.price,
        date: new Date(formData.date),
        time: formData.time,
        status: formData.status,
        memo: formData.memo,
      };

      let savedReservation: Reservation;
      if (reservation) {
        await reservationService.update(reservation.id, reservationData);
        const updatedReservation = await reservationService.getById(reservation.id);
        if (!updatedReservation) {
          throw new Error('예약 업데이트 실패');
        }
        savedReservation = updatedReservation;
      } else {
        const newId = await reservationService.create(reservationData);
        const newReservation = await reservationService.getById(newId);
        if (!newReservation) {
          throw new Error('예약 생성 실패');
        }
        savedReservation = newReservation;
      }

      onSave(savedReservation, 'close');
    } catch (error) {
      console.error('예약 저장 실패:', error);
      alert(t('reservations.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="reservation-modal-header">
          <h2 className="reservation-modal-title">
            {reservation ? t('reservations.editReservation') : t('reservations.newReservation')}
          </h2>
          <button onClick={onClose} className="btn btn-icon">
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="customer">{t('reservations.customer')}</label>
            <div className="customer-select-group">
              <select
                id="customer"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
              >
                <option value="">{t('reservations.selectCustomer')}</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phone})
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={() => setIsCustomerModalOpen(true)} 
                className="btn btn-secondary reservation-modal-add-customer-btn"
              >
                <UserPlus style={{ width: '1rem', height: '1rem' }} />
                {t('customers.newCustomer')}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="product">{t('reservations.product')}</label>
            <select
              id="product"
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              required
            >
              <option value="">{t('reservations.selectProduct')}</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatCurrency(product.price)}
                </option>
              ))}
            </select>
          </div>

          <div className="reservation-modal-grid">
            <div className="form-group">
              <label htmlFor="date">{t('reservations.date')}</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">{t('reservations.time')}</label>
              <div className="reservation-modal-time-select" style={{ display: 'flex', gap: '0.5rem' }}>
                <select value={amPm} onChange={e => setAmPm(e.target.value)} style={{ width: 70 }} required>
                  <option value="">AM/PM</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
                <select value={hour} onChange={e => setHour(e.target.value)} style={{ width: 70 }} required>
                  <option value="">{t('reservations.hour')}</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={(i+1).toString()}>{i+1}</option>
                  ))}
                </select>
                <select value={minute} onChange={e => setMinute(e.target.value)} style={{ width: 70 }} required>
                  <option value="">{t('reservations.minute')}</option>
                  {[...Array(12)].map((_, i) => {
                    const val = (i*5).toString().padStart(2, '0');
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="price">{t('reservations.price')}</label>
            <div className="price-input-wrapper">
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="price-input"
              />
              <span className="price-unit">{t('settings.currencies.KRW').split(' ')[0]}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">{t('reservations.status')}</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="confirmed">{t('reservations.statusConfirmed')}</option>
              <option value="cancelled">{t('reservations.statusCancelled')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="memo">{t('reservations.memo')}</label>
            <textarea
              id="memo"
              name="memo"
              value={formData.memo}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="reservation-modal-btn-group">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            {reservation && (
              <button 
                type="button" 
                onClick={handleChartClick}
                className="btn btn-chart"
              >
                <FileText style={{ width: '1rem', height: '1rem' }} />
                {t('customers.createChart')}
              </button>
            )}
            {reservation && onDelete && (
              <button 
                type="button" 
                onClick={handleDelete} 
                disabled={loading}
                className="btn btn-danger"
              >
                {loading ? t('common.deleting') : t('common.delete')}
              </button>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>

      {isCustomerModalOpen && (
        <CustomerModal
          customer={null}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={handleCustomerCreated}
        />
      )}
    </div>
  );
};

export default ReservationModal; 