import React, { useState, useEffect } from 'react';
import { X, UserPlus, ChevronDown, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Customer, Product, Reservation, ChartType } from '../types';
import { customerService, productService, reservationService } from '../services/firestore';
import CustomerModal from './CustomerModal';
import { useCurrencyFormat } from '../utils/currency';
import { formatDuration } from '../utils/timeUtils';

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
  const [amPm, setAmPm] = useState<string>('AM');
  const [hour, setHour] = useState<string>('');
  const [minute, setMinute] = useState<string>('00');
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 900);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    // 모바일에서 키보드가 올라올 때 뷰포트 높이 조정
    const handleViewportChange = () => {
      if (isMobile) {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    };

    if (isMobile) {
      window.addEventListener('resize', handleViewportChange);
      handleViewportChange();
    }
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      if (isMobile) {
        window.removeEventListener('resize', handleViewportChange);
        document.documentElement.style.removeProperty('--vh');
      }
    };
  }, [isMobile]);

  // 상품의 시간을 포맷팅하는 함수
  const formatProductDuration = (duration: number): string => {
    return formatDuration(duration);
  };

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

  const loadData = async () => {
    try {
      const [customerData, productData] = await Promise.all([
        customerService.getAll(),
        productService.getActive()
      ]);
      setCustomers(customerData);
      setProducts(productData);
      
      // 기존 예약의 상품 정보 설정
      if (reservation?.productId) {
        const product = productData.find(p => p.id === reservation.productId);
        setSelectedProduct(product || null);
      }
    } catch (error) {
      console.error(t('reservations.dataLoadError'), error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      
      // 기존 예약의 상품 정보 설정
      if (reservation.productId && products.length > 0) {
        const product = products.find(p => p.id === reservation.productId);
        setSelectedProduct(product || null);
      }
    } else if (initialCustomerId) {
      // 새 예약 생성 시 초기 고객 ID 설정
      setFormData(prev => ({ ...prev, customerId: initialCustomerId }));
    }
  }, [reservation, initialCustomerId, products]);

  useEffect(() => {
    // 기존 예약 수정 시 시간 값 세팅
    if (reservation?.time) {
      const [h, m] = reservation.time.split(':');
      let hNum = parseInt(h, 10);
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
      // 새 예약 생성 시 AM을 기본값으로 설정
      setAmPm('AM');
      setHour('');
      setMinute('00');
    }
  }, [reservation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      // 가격 필드는 숫자만 허용하고 number 타입으로 변환
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue ? parseInt(numericValue, 10) : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // status 변경 시 로그 추가
    if (name === 'status') {
      console.log('예약 상태 변경:', value);
    }

    if (name === 'productId') {
      const product = products.find(p => p.id === value);
      setSelectedProduct(product || null);
      // 상품 선택 시 가격 자동 업데이트
      if (product) {
        setFormData(prev => ({ ...prev, price: product.price }));
      } else {
        setFormData(prev => ({ ...prev, price: 0 }));
      }
    }
  };

  // 모바일에서 입력 필드 포커스 시 자동 스크롤
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isMobile) {
      setTimeout(() => {
        e.target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
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

  const saveReservation = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setLoading(true);
    try {
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      const selectedProduct = products.find(p => p.id === formData.productId);

      if (!selectedCustomer || !selectedProduct) {
        alert(t('reservations.selectCustomerAndProduct'));
        setLoading(false);
        return;
      }

      // 시간 입력 검증 - AM/PM, 시간이 선택되었는지 확인 (분은 선택하지 않으면 00으로 처리)
      if (!amPm || !hour) {
        alert(t('reservations.timeRequired'));
        setLoading(false);
        return;
      }

      // 시간을 24시간 형식으로 변환 (분이 없으면 00으로 처리)
      let h = parseInt(hour, 10);
      if (amPm === 'AM') {
        if (h === 12) h = 0;
      } else {
        if (h !== 12) h += 12;
      }
      const timeValue = `${h.toString().padStart(2, '0')}:${minute || '00'}`;

      const reservationData = {
        customerId: formData.customerId,
        customerName: selectedCustomer.name,
        productId: formData.productId,
        productName: selectedProduct.name,
        price: formData.price,
        date: new Date(formData.date),
        time: timeValue,
        status: formData.status,
        memo: formData.memo,
      };

      let savedReservation: Reservation;

      if (reservation) {
        // 기존 예약 수정
        console.log('예약 업데이트 중:', reservation.id, reservationData);
        await reservationService.update(reservation.id, reservationData);
        const updatedReservation = await reservationService.getById(reservation.id);
        if (!updatedReservation) {
          throw new Error(t('reservations.updateError'));
        }
        savedReservation = updatedReservation;
        console.log('예약 업데이트 완료:', savedReservation);
      } else {
        // 새 예약 생성
        const newId = await reservationService.create(reservationData);
        const newReservation = await reservationService.getById(newId);
        if (!newReservation) {
          throw new Error(t('reservations.createError'));
        }
        savedReservation = newReservation;
      }

      onSave(savedReservation, 'close');
    } catch (error) {
      console.error(t('reservations.saveError'), error);
      alert(`${t('reservations.saveError')}: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`modal-overlay ${isMobile ? 'reservation-modal-page' : ''}`} 
      onClick={onClose}
      style={{ 
        touchAction: isMobile ? 'pan-y' : 'auto' // 모바일에서 수직 스크롤만 허용
      }}
    >
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{
          touchAction: isMobile ? 'pan-y' : 'auto'
        }}
      >
        <div className="reservation-modal-header">
          <h2 className="reservation-modal-title">
            {reservation ? t('reservations.editReservation') : t('reservations.newReservation')}
          </h2>
          <button onClick={onClose} className="btn btn-icon">
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        <form onSubmit={saveReservation}>
          <div className="form-group">
            <label htmlFor="customer">{t('reservations.customer')}</label>
            <div className="customer-select-group">
              <select
                id="customer"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                onFocus={handleInputFocus}
                required
              >
                <option value=""></option>
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

          {
            reservation &&
            <div className="form-group">
              <label htmlFor="status">{t('reservations.status')}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                onFocus={handleInputFocus}
              >
                <option value="confirmed">{t('reservations.statusConfirmed')}</option>
                <option value="noshow">{t('reservations.statusNoshow')}</option>
                <option value="cancelled">{t('reservations.statusCancelled')}</option>
              </select>
            </div>
          }

          {isMobile ? (
            // 모바일: 날짜와 시간을 별도 행으로 표시
            <>
              <div className="form-group">
                <label htmlFor="date">{t('reservations.date')}</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">{t('reservations.time')}</label>
                <div className="reservation-modal-time-select" style={{ display: 'flex', gap: '0.5rem' }}>
                  <select value={amPm} onChange={e => setAmPm(e.target.value)} onFocus={handleInputFocus} style={{ width: 70 }} required>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                  <select value={hour} onChange={e => setHour(e.target.value)} onFocus={handleInputFocus} style={{ width: 70 }} required>
                    <option value="">{t('reservations.hour')}</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={(i+1).toString()}>{i+1}</option>
                    ))}
                  </select>
                  <select value={minute} onChange={e => setMinute(e.target.value)} onFocus={handleInputFocus} style={{ width: 70 }}>
                    <option value="00">00</option>
                    {[...Array(12)].map((_, i) => {
                      const val = (i*5).toString().padStart(2, '0');
                      return <option key={val} value={val}>{val}</option>;
                    })}
                  </select>
                </div>
              </div>
            </>
          ) : (
            // 데스크탑: 기존 그리드 레이아웃 유지
            <div className="reservation-modal-grid">
              <div className="form-group">
                <label htmlFor="date">{t('reservations.date')}</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">{t('reservations.time')}</label>
                <div className="reservation-modal-time-select" style={{ display: 'flex', gap: '0.5rem' }}>
                  <select value={amPm} onChange={e => setAmPm(e.target.value)} onFocus={handleInputFocus} style={{ width: 70 }} required>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                  <select value={hour} onChange={e => setHour(e.target.value)} onFocus={handleInputFocus} style={{ width: 70 }} required>
                    <option value="">{t('reservations.hour')}</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={(i+1).toString()}>{i+1}</option>
                    ))}
                  </select>
                  <select value={minute} onChange={e => setMinute(e.target.value)} onFocus={handleInputFocus} style={{ width: 70 }}>
                    <option value="00">00</option>
                    {[...Array(12)].map((_, i) => {
                      const val = (i*5).toString().padStart(2, '0');
                      return <option key={val} value={val}>{val}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="product">{t('reservations.product')}</label>
            <select
              id="product"
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              onFocus={handleInputFocus}
              required
            >
              <option value=""></option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.duration ? formatProductDuration(product.duration) : t('reservations.timeNotSet')})
                </option>
              ))}
            </select>
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
                onFocus={handleInputFocus}
                pattern="[0-9]*"
                inputMode="numeric"
                required
                className="price-input"
              />
              <span className="price-unit">{t('settings.currencies.KRW').split(' ')[0]}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="memo">{t('reservations.memo')}</label>
            <textarea
              id="memo"
              name="memo"
              value={formData.memo}
              onChange={handleChange}
              onFocus={handleInputFocus}
              rows={3}
            />
          </div>

          <div className="reservation-modal-btn-group">
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