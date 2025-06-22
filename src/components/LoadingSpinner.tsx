import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text, fullScreen = false }) => {
  const { t } = useTranslation();
  const displayText = text || t('common.loading');
  
  const spinner = (
    <div className={`loading-spinner ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="spinner"></div>
      {displayText && <p className="spinner-text">{displayText}</p>}
    </div>
  );

  return spinner;
};

export default LoadingSpinner; 