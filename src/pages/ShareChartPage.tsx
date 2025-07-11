import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shareCodeService, reservationService } from '../services/firestore';
import type { Customer, Reservation } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ChartDisplay from '../components/ChartDisplay';
import ChartDrawingDisplay from '../components/ChartDrawingDisplay';
import Button from '../components/Button';

// Shape 타입 정의
type Shape = {
  id: number;
  type: 'circle';
  x: number;
  y: number;
  text?: string;
};

// ChartData 타입 확장: drawings 필드 추가
interface ChartDataWithDrawings {
  memo?: string;
  drawings?: {
    faceSideRight: Shape[];
    faceSideLeft: Shape[];
    faceFront: Shape[];
    body: Shape[];
  };
  [key: string]: any;
}

const ShareChartPage: React.FC = () => {
  const { shareCode, reservationId } = useParams<{ shareCode: string; reservationId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 인증 및 데이터 로드
  useEffect(() => {
    const loadCustomerAndReservation = async () => {
      if (!shareCode || !reservationId) {
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
        if (customerData.sharePassword && !isSessionAuthed) {
          setIsPasswordRequired(true);
          setIsLoading(false);
        } else {
          setIsAuthenticated(true);
          await loadReservation(reservationId);
        }
      } catch (e) {
        setError(t('sharePage.loadError'));
        setIsLoading(false);
      }
    };
    loadCustomerAndReservation();
    // eslint-disable-next-line
  }, [shareCode, reservationId, t]);

  const loadReservation = async (reservationId: string) => {
    try {
      const reservationData = await reservationService.getById(reservationId);
      setReservation(reservationData);
    } catch (e) {
      setError(t('sharePage.loadError'));
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
        if (reservationId) {
          await loadReservation(reservationId);
        }
      } else {
        setError(t('sharePage.invalidPassword'));
      }
    } catch (e) {
      setError(t('sharePage.verificationError'));
    } finally {
      setIsLoading(false);
    }
  };

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
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              {error && <div className="error-message">{error}</div>}
              <Button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? <LoadingSpinner /> : t('sharePage.authenticate')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!customer || !reservation) {
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
          <h1>{t('chart.title')}</h1>
          <p>{t('sharePage.subtitle')}</p>
        </div>
        <div className="customer-section">
          <div className="customer-info-simple">
            <h3>{customer.name}</h3>
            <p>{customer.phone}</p>
          </div>
        </div>
        <div className="chart-section">
          <ChartDisplay chartType={reservation.chartType || ''} chartData={reservation.chartData || {}} />
          
          {/* 차트 그림 표시 */}
          {(reservation.chartData as ChartDataWithDrawings)?.drawings && (
            <div className="chart-drawings-section">
              <h3 style={{ 
                textAlign: 'center', 
                marginBottom: '1.5rem', 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: '#5C4630'
              }}>
                {t('chart.drawingTitle')}
              </h3>
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                flexWrap: 'wrap', 
                justifyContent: 'center',
                marginBottom: '2rem'
              }}>
                <ChartDrawingDisplay 
                  imageUrl="/chart-templates/face-side-right.png" 
                  width={300} 
                  height={300} 
                  shapes={(reservation.chartData as ChartDataWithDrawings)?.drawings?.faceSideRight || []}
                  title={t('chart.faceSideRight')}
                />
                <ChartDrawingDisplay 
                  imageUrl="/chart-templates/face-side-left.png" 
                  width={300} 
                  height={300} 
                  shapes={(reservation.chartData as ChartDataWithDrawings)?.drawings?.faceSideLeft || []}
                  title={t('chart.faceSideLeft')}
                />
                <ChartDrawingDisplay 
                  imageUrl="/chart-templates/face-front.png" 
                  width={300} 
                  height={300} 
                  shapes={(reservation.chartData as ChartDataWithDrawings)?.drawings?.faceFront || []}
                  title={t('chart.faceFront')}
                />
                <ChartDrawingDisplay 
                  imageUrl="/chart-templates/body.png" 
                  width={300} 
                  height={300} 
                  shapes={(reservation.chartData as ChartDataWithDrawings)?.drawings?.body || []}
                  title={t('chart.body')}
                />
              </div>
            </div>
          )}
        </div>
        <div className="share-footer" style={{ marginTop: '2rem' }}>
          <Button onClick={() => navigate(-1)} className="btn-secondary">{t('common.back')}</Button>
        </div>
      </div>
    </div>
  );
};

export default ShareChartPage; 