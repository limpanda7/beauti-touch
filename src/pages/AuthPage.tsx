import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';
import LanguageSelector from '../components/LanguageSelector';
import '../styles/pages/_auth.scss';

const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);

  const handleSwitchToSignUp = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <div className="auth-page">
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