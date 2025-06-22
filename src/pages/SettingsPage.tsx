import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Globe, DollarSign, Briefcase } from 'lucide-react';
import { useSettings, type Settings } from '../contexts/SettingsContext';
import type { ChartType } from '../types';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const handleSettingChange = (key: keyof Settings, value: string) => {
    if (key === 'businessType') {
      updateSettings({ [key]: value as ChartType });
    } else {
      updateSettings({ [key]: value });
    }
    
    if (key === 'language') {
      i18n.changeLanguage(value);
    }
  };

  const languages = [
    { code: 'ko', name: t('settings.languages.ko') },
    { code: 'en', name: t('settings.languages.en') },
    { code: 'vi', name: t('settings.languages.vi') },
    { code: 'th', name: t('settings.languages.th') },
    { code: 'pt', name: t('settings.languages.pt') },
    { code: 'es', name: t('settings.languages.es') }
  ];

  const currencies = [
    { code: 'KRW', name: t('settings.currencies.KRW') },
    { code: 'USD', name: t('settings.currencies.USD') },
    { code: 'EUR', name: t('settings.currencies.EUR') },
    { code: 'VND', name: t('settings.currencies.VND') },
    { code: 'THB', name: t('settings.currencies.THB') },
    { code: 'BRL', name: t('settings.currencies.BRL') },
    { code: 'MXN', name: t('settings.currencies.MXN') }
  ];

  const businessTypes = [
    { code: '', name: '-' },
    { code: 'eyelash', name: t('settings.businessTypes.eyelash') },
    { code: 'waxing', name: t('settings.businessTypes.waxing') },
    { code: 'nail', name: t('settings.businessTypes.nail') },
    { code: 'skin', name: t('settings.businessTypes.skin') },
    { code: 'massage', name: t('settings.businessTypes.massage') }
  ];

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>{t('settings.title')}</h1>
      </div>
      
      <div className="settings-grid">
        <div className="settings-item">
          <div className="settings-item-header">
            <Globe className="settings-item-icon" />
            <h2 className="settings-item-title">{t('settings.language')}</h2>
          </div>
          <p className="settings-item-description">{t('settings.languageDescription')}</p>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="settings-select"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="settings-item">
          <div className="settings-item-header">
            <DollarSign className="settings-item-icon" />
            <h2 className="settings-item-title">{t('settings.currency')}</h2>
          </div>
          <p className="settings-item-description">{t('settings.currencyDescription')}</p>
          <select
            value={settings.currency}
            onChange={(e) => handleSettingChange('currency', e.target.value)}
            className="settings-select"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>{currency.name}</option>
            ))}
          </select>
        </div>

        <div className="settings-item">
          <div className="settings-item-header">
            <Briefcase className="settings-item-icon" />
            <h2 className="settings-item-title">{t('settings.businessType')}</h2>
          </div>
          <p className="settings-item-description">{t('settings.businessTypeDescription')}</p>
          <select
            value={settings.businessType}
            onChange={(e) => handleSettingChange('businessType', e.target.value)}
            className="settings-select"
          >
            {businessTypes.map(businessType => (
              <option key={businessType.code} value={businessType.code}>{businessType.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 