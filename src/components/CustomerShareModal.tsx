import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { shareCodeService } from '../services/firestore';
import { generateShareUrl } from '../utils/shareCodeUtils';
import type { Customer } from '../types';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface ShareCodeModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onShareCodeUpdated: () => void;
}

const CustomerShareModal: React.FC<ShareCodeModalProps> = ({
  customer,
  isOpen,
  onClose,
  onShareCodeUpdated
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');

  // Share Code 생성
  const handleCreateShareCode = async () => {
    if (!customer.id) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const shareCode = await shareCodeService.createShareCode(
        customer.id, 
        password || undefined
      );
      
      const url = generateShareUrl(shareCode);
      setShareUrl(url);
      
      // QR 코드 생성
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
      
      onShareCodeUpdated();
    } catch (error) {
      console.error('Share Code 생성 실패:', error);
      setError(t('shareCode.createError'));
    } finally {
      setIsLoading(false);
    }
  };



  // 비밀번호 변경 (기존 코드 유지)
  const handleUpdatePassword = async () => {
    if (!customer.id) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 기존 shareCode를 유지하고 비밀번호만 업데이트하기 위해
      // regenerateShareCode를 사용하되 기존 코드와 동일한 코드를 생성
      const newShareCode = await shareCodeService.regenerateShareCode(
        customer.id,
        password || undefined
      );
      
      // 비밀번호 입력 필드 초기화
      setPassword('');
      onShareCodeUpdated();
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      setError(t('shareCode.updatePasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 제거
  const handleRemovePassword = async () => {
    if (!customer.id) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const newShareCode = await shareCodeService.regenerateShareCode(
        customer.id,
        undefined // 비밀번호 없이 재생성
      );
      
      const url = generateShareUrl(newShareCode);
      setShareUrl(url);
      
      // QR 코드 재생성
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
      
      setPassword(''); // 비밀번호 입력 필드 초기화
      onShareCodeUpdated();
    } catch (error) {
      console.error('비밀번호 제거 실패:', error);
      setError(t('shareCode.regenerateError'));
    } finally {
      setIsLoading(false);
    }
  };

  // URL 복사
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // 복사 성공 알림 (토스트나 알림 추가 가능)
    } catch (error) {
      console.error('URL 복사 실패:', error);
    }
  };

  // QR 코드 다운로드
  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `share-code-${customer.name}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  // 모달이 열릴 때 기존 Share Code 정보 로드
  useEffect(() => {
    if (isOpen && customer.shareCode && customer.shareEnabled) {
      const url = generateShareUrl(customer.shareCode);
      setShareUrl(url);
      
      // QR 코드 생성
      QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(setQrCodeDataUrl);
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content share-code-modal">
        <div className="modal-header">
          <h2>{t('shareCode.modalTitle')}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="customer-info">
            <h3>{t('customers.name')}: {customer.name}</h3>
            <p>{t('customers.phone')}: {customer.phone}</p>
          </div>

          {!customer.shareCode || !customer.shareEnabled ? (
            // Share Code 생성 섹션
            <div className="create-share-code">
              <div className="form-group">
                <label>{t('shareCode.passwordLabel')} ({t('shareCode.optional')})</label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('shareCode.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <small>{t('shareCode.passwordDescription')}</small>
              </div>

              <Button
                onClick={handleCreateShareCode}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? <LoadingSpinner /> : t('shareCode.create')}
              </Button>
            </div>
          ) : (
            // Share Code 관리 섹션
            <div className="manage-share-code">
              <div className="share-info">
                <div className="qr-code-section">
                  <h4>{t('shareCode.qrCode')}</h4>
                  {qrCodeDataUrl && (
                    <div className="qr-code-container">
                      <img src={qrCodeDataUrl} alt="QR Code" />
                      <div className="qr-actions">
                        <Button onClick={handleDownloadQR} className="btn-secondary">
                          {t('shareCode.downloadQR')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="url-section">
                  <h4>{t('shareCode.shareUrl')}</h4>
                  <div className="url-container">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="url-input"
                    />
                    <Button onClick={handleCopyUrl} className="btn-secondary">
                      {t('shareCode.copy')}
                    </Button>
                  </div>
                </div>

                <div className="password-section">
                  <h4>{t('shareCode.password')}</h4>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('shareCode.passwordPlaceholder')}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <small className="password-description">{t('shareCode.passwordDescription')}</small>
                  <div className="password-actions">
                    <Button
                      onClick={handleUpdatePassword}
                      disabled={isLoading || !password}
                      className="btn-secondary"
                      size="sm"
                    >
                      {isLoading ? <LoadingSpinner /> : t('shareCode.setPassword')}
                    </Button>
                    {customer.sharePassword && (
                      <Button
                        onClick={handleRemovePassword}
                        disabled={isLoading}
                        className="btn-danger"
                        size="sm"
                      >
                        {isLoading ? <LoadingSpinner /> : t('shareCode.removePassword')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>


            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerShareModal; 