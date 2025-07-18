import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, FileText } from 'lucide-react';
import { shareCodeService } from '../services/firestore';
import { reservationService } from '../services/firestore';
import type { Customer, Reservation } from '../types';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomerInfo from '../components/CustomerInfo';
import ChartDisplay from '../components/ChartDisplay';
import '../styles/components/_share-code.scss';

const SharePage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Share Code로 고객 정보 조회
  useEffect(() => {
    const loadCustomer = async () => {
      if (!shareCode) {
        setError(t('sharePage.invalidCode'));
        setIsLoading(false);
        return;
      }

      // 인증 세션 체크
      const sessionKey = `shareAuth:${shareCode}`;
      const isSessionAuthed = sessionStorage.getItem(sessionKey) === 'true';

      try {
        const customerData = await shareCodeService.getCustomerByShareCode(shareCode);
        
        if (!customerData) {
          setError(t('sharePage.customerNotFound'));
          setIsLoading(false);
          return;
        }

        setCustomer(customerData);
        
        // 비밀번호가 설정되어 있고 세션 인증이 없으면 비밀번호 요구
        if (customerData.sharePassword && !isSessionAuthed) {
          setIsPasswordRequired(true);
          setIsLoading(false);
        } else {
          // 비밀번호가 없거나 세션 인증이 있으면 바로 인증 완료
          setIsAuthenticated(true);
          await loadReservations(customerData.id);
        }
      } catch (error) {
        console.error('고객 정보 조회 실패:', error);
        setError(t('sharePage.loadError'));
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [shareCode, t]);

  // 예약 정보 로드
  const loadReservations = async (customerId: string) => {
    try {
      const reservationData = await reservationService.getByCustomerId(customerId);
      setReservations(reservationData);
    } catch (error) {
      console.error('예약 정보 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 인증
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shareCode || !password.trim()) {
      setError(t('sharePage.passwordRequiredError'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isValid = await shareCodeService.verifySharePassword(shareCode, password);
      
      if (isValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem(`shareAuth:${shareCode}`, 'true');
        if (customer) {
          await loadReservations(customer.id);
        }
      } else {
        setError(t('sharePage.invalidPassword'));
      }
    } catch (error) {
      console.error('비밀번호 검증 실패:', error);
      setError(t('sharePage.verificationError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 방문이력: 차트 완료된 예약만 필터링
  const completedReservations = reservations.filter(r => r.status === 'completed');

  if (isLoading) {
    return (
      <div className="share-page">
        <div className="share-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="share-page">
        <div className="share-container">
          <div className="error-container">
            <h2>{t('sharePage.error')}</h2>
            <p>{error}</p>
            <Button onClick={() => navigate('/')} className="btn-primary">
              {t('sharePage.goHome')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isPasswordRequired && !isAuthenticated) {
    return (
      <div className="share-page">
        <div className="share-container">
          <div className="password-form">
            <h2>{t('sharePage.passwordRequired')}</h2>
            <p>{t('sharePage.passwordDescription')}</p>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>{t('sharePage.password')}</label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('sharePage.passwordPlaceholder')}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <Button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? <LoadingSpinner /> : t('sharePage.authenticate')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="share-page">
        <div className="share-container">
          <div className="error-container">
            <h2>{t('sharePage.customerNotFound')}</h2>
            <Button onClick={() => navigate('/')} className="btn-primary">
              {t('sharePage.goHome')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="share-page">
      <div className="share-container">
        <div className="share-header">
          <h1>{t('sharePage.title')}</h1>
          <p>{t('sharePage.subtitle')}</p>
        </div>

        <div className="customer-section">
          <div className="customer-info-simple">
            <h3>{t('customers.name')}: {customer.name}</h3>
            <p>{t('customers.phone')}: {customer.phone}</p>
          </div>
        </div>

        <div className="reservations-section">
          <h2>{t('sharePage.reservations')}</h2>
          {completedReservations.length === 0 ? (
            <div className="no-reservations">
              <p>{t('sharePage.noReservations')}</p>
            </div>
          ) : (
            <div className="reservations-list">
              {completedReservations.map((reservation) => (
                <div key={reservation.id} className="reservation-item">
                  <div className="reservation-header">
                    <h3>{reservation.productName}</h3>
                    <span className={`status status-${reservation.status}`}>
                      {t(`reservations.status${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}`)}
                    </span>
                  </div>
                  <div className="reservation-details">
                    <p>
                      <strong>{t('reservations.date')}:</strong> {new Date(reservation.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p>
                      <strong>{t('reservations.time')}:</strong> {reservation.time}
                    </p>
                    <p>
                      <strong>{t('reservations.price')}:</strong> {reservation.price.toLocaleString()}{t('common.currency')}
                    </p>
                    {reservation.memo && (
                      <p>
                        <strong>{t('reservations.memo')}:</strong> {reservation.memo}
                      </p>
                    )}
                  </div>
                  
                  {/* 차트 보기 버튼 */}
                  {reservation.chartType && reservation.chartData && (
                    <div className="reservation-chart-section">
                      <Button
                        onClick={() => navigate(`/share/${shareCode}/chart/${reservation.id}`)}
                        variant="secondary"
                        size="sm"
                        className="chart-view-btn"
                      >
                        <FileText style={{ width: '1rem', height: '1rem' }} />
                        {t('chart.viewChart')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="share-footer">
          <p>{t('sharePage.footer')}</p>
        </div>
      </div>
    </div>
  );
};

export default SharePage; 