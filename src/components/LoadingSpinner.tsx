import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text, fullScreen = false }) => {
  const { t } = useTranslation();
  const displayText = text || t('common.loading');
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // 약간의 지연 후 표시하여 빠른 로딩에서는 깜빡이지 않도록 함
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);
    
    return () => clearTimeout(timer);
  }, []);
  
  const spinner = (
    <div className={`loading-spinner ${fullScreen ? 'fullscreen' : ''} ${isVisible ? 'visible' : ''}`}>
      <div className="spinner"></div>
      {displayText && <p className="spinner-text">{displayText}</p>}
    </div>
  );

  return spinner;
};

export default LoadingSpinner; 