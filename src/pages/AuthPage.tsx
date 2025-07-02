import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';
import LanguageSelector from '../components/LanguageSelector';
import SEO from '../components/SEO';
import { handleGoogleRedirectResult } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import '../styles/pages/_auth.scss';

const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);

  // Google 리다이렉트 결과 처리
  useEffect(() => {
    const processRedirectResult = async () => {
      try {
        const user = await handleGoogleRedirectResult();
        if (user) {
          setUser(user);
          navigate('/dashboard/reservations');
        }
      } catch (error) {
        console.error('Google 리다이렉트 결과 처리 실패:', error);
      }
    };

    processRedirectResult();
  }, [setUser, navigate]);

  const handleSwitchToSignUp = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="auth-page">
      <SEO 
        title={`${isLogin ? t('auth.login') : t('auth.signUp')} - ${t('navigation.pageTitle')}`}
        description={isLogin ? t('auth.loginDescription') : t('auth.signUpDescription')}
        keywords={t('navigation.seoKeywords.auth')}
      />
      
      <button 
        className="auth-back-button" 
        onClick={handleGoBack}
        type="button"
        aria-label={t('common.back')}
      >
        <ArrowLeft size={20} />
      </button>
      
      <LanguageSelector />
      
      <div className="auth-container">
        <div className="auth-logo">
          <img src="/logo.png" alt="Beauti-Touch" />
        </div>
        
        <div className="auth-content">
          {isLogin ? (
            <LoginForm onSwitchToSignUp={handleSwitchToSignUp} />
          ) : (
            <SignUpForm onSwitchToLogin={handleSwitchToLogin} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 