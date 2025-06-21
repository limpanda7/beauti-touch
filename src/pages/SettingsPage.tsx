import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Globe, DollarSign, Briefcase } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const handleLanguageChange = (language: string) => {
    updateSettings({ language });
    i18n.changeLanguage(language);
  };

  const handleCurrencyChange = (currency: string) => {
    updateSettings({ currency });
  };

  const handleBusinessTypeChange = (businessType: string) => {
    updateSettings({ businessType: businessType as any });
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
      <h1 className="settings-title">{t('settings.title')}</h1>

      <div className="settings-card">
        <h2 className="settings-card-title">
          <Globe style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
          {t('settings.language')}
        </h2>
        <div className="settings-list">
          {languages.map(lang => (
            <label key={lang.code} className="settings-list-label">
              <input
                type="radio"
                name="language"
                value={lang.code}
                checked={settings.language === lang.code}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="settings-radio"
              />
              <span className="settings-list-text">{lang.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <h2 className="settings-card-title">
          <DollarSign style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
          {t('settings.currency')}
        </h2>
        <div className="settings-list">
          {currencies.map(currency => (
            <label key={currency.code} className="settings-list-label">
              <input
                type="radio"
                name="currency"
                value={currency.code}
                checked={settings.currency === currency.code}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="settings-radio"
              />
              <span className="settings-list-text">{currency.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <h2 className="settings-card-title">
          <Briefcase style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
          {t('settings.businessType')}
        </h2>
        <p className="settings-description">{t('settings.businessTypeDescription')}</p>
        <div className="settings-list">
          {businessTypes.map(businessType => (
            <label key={businessType.code} className="settings-list-label">
              <input
                type="radio"
                name="businessType"
                value={businessType.code}
                checked={settings.businessType === businessType.code}
                onChange={(e) => handleBusinessTypeChange(e.target.value)}
                className="settings-radio"
              />
              <span className="settings-list-text">{businessType.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-btn-group">
        <button
          onClick={() => {
            // Settings are automatically saved when changed
          }}
          className="settings-btn-save"
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage; 