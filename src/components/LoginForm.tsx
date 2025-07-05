import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertTriangle } from 'lucide-react';
import { useAuthStore, useIsAuthenticated } from '../stores/authStore';
import { getBrowserInfo } from '../utils/browserUtils';
import { isWebViewEnvironment, requestGoogleLogin } from '../services/webviewBridge';
import type { LoginCredentials } from '../types';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
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

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignUp }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, isLoading, error, errorCode, clearError } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const browserInfo = getBrowserInfo();
  
  // 브라우저별 경고 메시지
  const getBrowserWarningMessage = () => {
    if (browserInfo.isNaver) {
      return t('auth.browserWarning.naver');
    }
    if (browserInfo.isInApp) {
      return t('auth.browserWarning.inApp');
    }
    return '';
  };
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  // 이메일 기억하기 기능
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setCredentials(prev => ({ ...prev, email: savedEmail }));
      setRememberEmail(true);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleRememberEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberEmail(e.target.checked);
    if (e.target.checked) {
      localStorage.setItem('rememberedEmail', credentials.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rememberEmail) {
      localStorage.setItem('rememberedEmail', credentials.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    
    try {
      await signIn(credentials);
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 웹뷰 환경인지 확인
      if (isWebViewEnvironment()) {
        console.log('웹뷰 환경에서 네이티브 구글 로그인 요청');
        requestGoogleLogin();
        return;
      }
      
      // 일반 웹 환경에서는 기존 방식 사용
      await signInWithGoogle();
    } catch (error) {
      if (error instanceof Error && error.message === 'REDIRECT_INITIATED') {
        // 리다이렉트가 시작된 경우는 에러로 처리하지 않음
        console.log('Google 로그인 리다이렉트 시작됨');
        return;
      }
      console.error('Google 로그인 실패:', error);
    }
  };

  // 로그인 성공 시 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      console.log('로그인 성공, 대시보드로 이동');
      navigate('/dashboard/reservations', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="auth-form-container">
      <div className="auth-form-header">
        <h2>{t('auth.login')}</h2>
        <p>{renderBoldText(t('auth.loginDescription'))}</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="auth-error">
            {errorCode && errorCode.startsWith('auth.errors.') ? t(errorCode) : error}
          </div>
        )}

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
        </div>

        <div className="form-group remember-email-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={handleRememberEmailChange}
              disabled={isLoading}
              className="remember-checkbox"
            />
            <span className="checkmark"></span>
            {t('auth.rememberEmail')}
          </label>
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={isLoading || !credentials.email || !credentials.password}
        >
          {isLoading ? t('auth.loggingIn') : t('auth.login')}
        </button>
      </form>

      <div className="auth-divider">
        <span className="auth-divider-text">{t('auth.or')}</span>
      </div>

      {getBrowserWarningMessage() && (
        <div className="browser-warning">
          <AlertTriangle size={16} />
          <span>{getBrowserWarningMessage()}</span>
        </div>
      )}

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
          {t('auth.noAccount')}{' '}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={onSwitchToSignUp}
            disabled={isLoading}
          >
            {t('auth.signUp')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm; 