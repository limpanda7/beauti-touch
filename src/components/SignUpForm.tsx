import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuthStore, useIsAuthenticated } from '../stores/authStore';
import type { SignUpCredentials } from '../types';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

// 볼드 처리된 텍스트를 렌더링하는 함수
const renderBoldText = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index}>{part}</strong>;
    }
    // 줄넘김을 <br> 태그로 변환
    return part.split('\n').map((line, lineIndex) => (
      <React.Fragment key={`${index}-${lineIndex}`}>
        {lineIndex > 0 && <br />}
        {line}
      </React.Fragment>
    ));
  });
};

const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  const { t } = useTranslation();
  const { signUp, signInWithGoogle, isLoading, error, errorCode, clearError } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  
  const [credentials, setCredentials] = useState<SignUpCredentials>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // 인증 상태 변경 감지
  useEffect(() => {
    if (isAuthenticated) {
      console.log('SignUpForm - 인증됨, 메인 페이지로 이동');
      window.location.href = '/dashboard/reservations';
    }
  }, [isAuthenticated]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 이메일 검증
    if (!credentials.email) {
      errors.email = t('auth.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = t('auth.emailInvalid');
    }

    // 이름 검증
    if (!credentials.displayName.trim()) {
      errors.displayName = t('auth.nameRequired');
    } else if (credentials.displayName.trim().length < 2) {
      errors.displayName = t('auth.nameTooShort');
    }

    // 비밀번호 검증
    if (!credentials.password) {
      errors.password = t('auth.passwordRequired');
    } else if (credentials.password.length < 6) {
      errors.password = t('auth.passwordTooShort');
    }

    // 비밀번호 확인 검증
    if (!credentials.confirmPassword) {
      errors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (credentials.password !== credentials.confirmPassword) {
      errors.confirmPassword = t('auth.passwordMismatch');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    
    // 입력 시 해당 필드의 검증 오류 제거
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await signUp(credentials);
      console.log('SignUpForm - 회원가입 성공');
    } catch (error) {
      console.error('회원가입 실패:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google 로그인 실패:', error);
    }
  };

  const getFieldError = (fieldName: string): string => {
    return validationErrors[fieldName] || '';
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-header">
        <h2>{t('auth.signUp')}</h2>
        <p>{renderBoldText(t('auth.signUpDescription'))}</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="auth-error">
            {errorCode && errorCode.startsWith('auth.errors.') ? t(errorCode) : error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="displayName">{t('auth.name')}</label>
          <div className="input-wrapper">
            <User className="input-icon" size={20} />
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={credentials.displayName}
              onChange={handleInputChange}
              placeholder={t('auth.namePlaceholder')}
              required
              disabled={isLoading}
            />
          </div>
          {getFieldError('displayName') && (
            <div className="field-error">{getFieldError('displayName')}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">{t('auth.email')}</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              placeholder={t('auth.emailPlaceholder')}
              required
              disabled={isLoading}
            />
          </div>
          {getFieldError('email') && (
            <div className="field-error">{getFieldError('email')}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">{t('auth.password')}</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder={t('auth.passwordPlaceholder')}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {getFieldError('password') && (
            <div className="field-error">{getFieldError('password')}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={20} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={credentials.confirmPassword}
              onChange={handleInputChange}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {getFieldError('confirmPassword') && (
            <div className="field-error">{getFieldError('confirmPassword')}</div>
          )}
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={isLoading || !credentials.email || !credentials.password || !credentials.confirmPassword || !credentials.displayName}
        >
          {isLoading ? t('auth.signingUp') : t('auth.signUp')}
        </button>
      </form>

      <div className="auth-divider">
        <span className="auth-divider-text">{t('auth.or')}</span>
      </div>

      <div className="social-login-buttons">
        <button
          type="button"
          className="social-login-btn google-btn"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="social-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.continueWithGoogle')}
        </button>
      </div>

      <div className="auth-switch">
        <p>
          {t('auth.haveAccount')}{' '}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            {t('auth.login')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm; 