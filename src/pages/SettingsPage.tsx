import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Globe, DollarSign, LogOut, User, Trash2, Search, Calendar, CreditCard } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore, useUser } from '../stores/authStore';
import { autoCompleteService } from '../services/firestore';
import type { ChartType, AutoCompleteSuggestion } from '../types';
import Button from '../components/Button';

import { formatDate } from '../utils/dateUtils';
import { getDefaultCurrencyForLanguage } from '../utils/currency';
import { getBrowserLanguage, saveLanguageToStorage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../utils/languageUtils';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { language, currency, updateSettings, isLoading } = useSettingsStore();
  const { signOut } = useAuthStore();
  const user = useUser();
  
  // 자동완성 관리 상태
  const [autoCompleteData, setAutoCompleteData] = useState<Record<string, AutoCompleteSuggestion[]>>({});
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 날짜 형식 미리보기를 위한 샘플 날짜
  const sampleDate = new Date(2024, 11, 25); // 2024년 12월 25일

  // 차트 필드 정의 (주관식 필드만 포함, 체크박스 필드 제외)
  const chartFieldDefs: Record<ChartType, { name: string; label: string }[]> = {
    eyelash: [
      { name: 'eyelashMaterial', label: t('chart.fields.eyelashMaterial') },
      { name: 'eyelashMix', label: t('chart.fields.eyelashMix') },
      { name: 'eyelashGlue', label: t('chart.fields.eyelashGlue') },
    ],
    waxing: [
      { name: 'waxingArea', label: t('chart.fields.waxingArea') },
      { name: 'waxingProduct', label: t('chart.fields.waxingProduct') },
      { name: 'waxingCycle', label: t('chart.fields.waxingCycle') },
    ],
    nail: [
      { name: 'nailColor', label: t('chart.fields.nailColor') },
      { name: 'nailFeedback', label: t('chart.fields.nailFeedback') },
    ],
    skin: [
      { name: 'skinProduct', label: t('chart.fields.skinProduct') },
    ],
    massage: [
      { name: 'massageArea', label: t('chart.fields.massageArea') },
      { name: 'massageOil', label: t('chart.fields.massageOil') },
    ],
    pilates: [
      { name: 'pilatesFeedback', label: t('chart.fields.pilatesFeedback') },
    ],
    default: [], // 기본 타입은 빈 배열
    '': [],
  };

  // 자동완성 데이터 로드
  const loadAutoCompleteData = async (chartType: ChartType, fieldName: string) => {
    if (!chartType || !fieldName) return;
    
    try {
      setLoading(true);
      const suggestions = await autoCompleteService.getSuggestions(fieldName, chartType, 50);
      setAutoCompleteData(prev => ({
        ...prev,
        [fieldName]: suggestions
      }));
    } catch (error) {
      console.error('자동완성 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 자동완성 데이터 삭제
  const handleDeleteAutoComplete = async (fieldName: string) => {
    if (!selectedChartType || !fieldName) return;
    
    if (window.confirm(t('settings.confirmDeleteAutoComplete'))) {
      try {
        await autoCompleteService.deleteFieldSuggestions(fieldName, selectedChartType);
        setAutoCompleteData(prev => {
          const newData = { ...prev };
          delete newData[fieldName];
          return newData;
        });
        alert(t('settings.autoCompleteDeleted'));
      } catch (error) {
        console.error('자동완성 데이터 삭제 실패:', error);
        alert(t('common.deleteError'));
      }
    }
  };



  // 필드 선택 시 자동완성 데이터 로드
  useEffect(() => {
    if (selectedChartType && selectedField) {
      loadAutoCompleteData(selectedChartType, selectedField);
    }
  }, [selectedChartType, selectedField]);

    const handleSettingChange = async (key: keyof { language: string; currency: string }, value: string) => {
    if (!user) {
      console.error('사용자가 로그인되지 않았습니다.');
      alert('로그인이 필요합니다.');
      return;
    }

    console.log('설정 변경 시도:', { key, value, user, uid: user.uid });

    try {
      await updateSettings({ [key]: value }, user);
      
      if (key === 'language') {
        // 지원하는 언어인지 확인
        if (value in SUPPORTED_LANGUAGES) {
          // i18n 언어 변경
          try {
            await i18n.changeLanguage(value);
          } catch (error) {
            console.error('i18n 언어 변경 실패:', error);
          }
          // localStorage에 언어 저장
          saveLanguageToStorage(value as SupportedLanguage);
        } else {
          console.warn(`지원하지 않는 언어: ${value}`);
        }
      }
    } catch (error) {
      console.error('설정 변경 실패:', error);
      alert(t('settings.saveError'));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const languages = [
    { code: 'ko', name: t('settings.languages.ko') },
    { code: 'en', name: t('settings.languages.en') },
    { code: 'vi', name: t('settings.languages.vi') },
    { code: 'th', name: t('settings.languages.th') },
    { code: 'pt', name: t('settings.languages.pt') },
    { code: 'es', name: t('settings.languages.es') },
    { code: 'id', name: t('settings.languages.id') }
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
            value={language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="settings-select"
            disabled={isLoading}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          
          {/* 날짜 형식 */}
          <div className="date-format">
            <Calendar size={16} />
            <span>{t('settings.dateFormat')}: </span>
            <span>{formatDate(sampleDate, 'medium', language)}</span>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-header">
            <DollarSign className="settings-item-icon" />
            <h2 className="settings-item-title">{t('settings.currency')}</h2>
          </div>
          <p className="settings-item-description">{t('settings.currencyDescription')}</p>
          <select
            value={currency}
            onChange={(e) => handleSettingChange('currency', e.target.value)}
            className="settings-select"
            disabled={isLoading}
          >
            {currencies.map(curr => (
              <option key={curr.code} value={curr.code}>{curr.name}</option>
            ))}
          </select>
        </div>



        {/* 자동완성 관리 섹션 */}
        <div className="settings-item">
          <div className="settings-item-header">
            <Search className="settings-item-icon" />
            <h2 className="settings-item-title">{t('settings.autoComplete')}</h2>
          </div>
          <p className="settings-item-description">{t('settings.autoCompleteDescription')}</p>
          
          <div className="autocomplete-management">
            <div className="autocomplete-filters">
              <select
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.target.value as ChartType)}
                className="settings-select"
              >
                <option value="">{t('settings.selectChartType')}</option>
                {Object.keys(chartFieldDefs).filter(key => key !== 'default' && key !== '').map(chartType => (
                  <option key={chartType} value={chartType}>{t(`chart.type.${chartType}`)}</option>
                ))}
              </select>
              
              {selectedChartType && (
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="settings-select"
                >
                  <option value="">{t('settings.selectField')}</option>
                  {chartFieldDefs[selectedChartType]?.map(field => (
                    <option key={field.name} value={field.name}>{field.label}</option>
                  ))}
                </select>
              )}
            </div>
            
            {selectedField && (
              <div className="autocomplete-data">
                <div className="autocomplete-data-header">
                  <h3>{chartFieldDefs[selectedChartType]?.find(f => f.name === selectedField)?.label}</h3>
                  <Button
                    onClick={() => handleDeleteAutoComplete(selectedField)}
                    variant="danger"
                    size="sm"
                  >
                    <Trash2 size={16} />
                    {t('settings.deleteAll')}
                  </Button>
                </div>
                
                {loading ? (
                  <div className="autocomplete-loading">{t('common.loading')}...</div>
                ) : (
                  <div className="autocomplete-suggestions-list">
                    {autoCompleteData[selectedField]?.length > 0 ? (
                      autoCompleteData[selectedField].map((suggestion, index) => (
                        <div key={index} className="autocomplete-suggestion-item-settings">
                          <span className="suggestion-text">{suggestion.value}</span>
                          <span className="suggestion-count">{suggestion.usageCount}회</span>
                        </div>
                      ))
                    ) : (
                      <div className="autocomplete-empty">{t('settings.noAutoCompleteData')}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 결제 섹션 */}
        <div className="settings-item">
          <div className="settings-item-header">
            <CreditCard className="settings-item-icon" />
            <h2 className="settings-item-title">{t('settings.billing')}</h2>
          </div>
          <p className="settings-item-description">{t('settings.billingDescription')}</p>
          
          <div className="billing-info">
            <div className="billing-plan">
              <div className="plan-header">
                <h3>{t('settings.currentPlan')}</h3>
                <span className="beta-badge">{t('settings.betaPeriod')}</span>
              </div>
              <div className="plan-details">
                <div className="plan-name">{t('settings.freeForOneMonth')}</div>
                <div className="plan-description">{t('settings.betaDescription')}</div>
              </div>
            </div>
            
            <div className="subscription-status">
              <div className="status-item">
                <span className="status-label">{t('settings.subscriptionStatus')}:</span>
                <span className="status-value active">{t('settings.active')}</span>
              </div>
            </div>
            
            <button
              type="button"
              className="manage-subscription-btn"
              disabled
            >
              <CreditCard size={16} />
              <span>{t('settings.manageSubscription')}</span>
            </button>
          </div>
        </div>

        {/* 계정 정보 섹션 - 모든 디바이스에서 표시 */}
        <div className="settings-item">
          <div className="settings-item-header">
            <User className="settings-item-icon" />
            <h2 className="settings-item-title">{t('settings.account')}</h2>
          </div>
          <p className="settings-item-description">{t('settings.accountDescription')}</p>
          
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user.displayName || user.email}</div>
                {
                  user.displayName &&
                  <div className="user-email">{user.email}</div>
                }
              </div>
            </div>
          )}
          
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 