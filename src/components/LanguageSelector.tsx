import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_NAMES,
  type SupportedLanguage,
  saveLanguageToStorage
} from '../utils/languageUtils';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { updateSettings } = useSettingsStore();
  const { user } = useAuthStore();
  const { setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = i18n.language as SupportedLanguage;

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      console.log('언어 변경 시도:', language);
      
      // languageStore를 통해 언어 변경 (i18n + localStorage + 스토어 상태 모두 업데이트)
      setLanguage(language);
      
      // 파이어스토어에 저장
      if (user) {
        await updateSettings({ language }, user);
      }
      
      console.log('언어 변경 성공:', language);
      setIsOpen(false);
    } catch (error) {
      console.error('언어 변경 실패:', error);
      // 에러 발생 시 원래 언어로 되돌리기
      setLanguage(currentLanguage);
      // 사용자에게 에러 알림
      alert(`언어 변경에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Globe size={16} />
        <span className="language-name">{LANGUAGE_NAMES[currentLanguage]}</span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, _]) => {
            const langCode = code as SupportedLanguage;
            return (
              <button
                key={langCode}
                className={`language-option ${currentLanguage === langCode ? 'active' : ''}`}
                onClick={() => handleLanguageChange(langCode)}
                type="button"
              >
                <span className="language-name">{LANGUAGE_NAMES[langCode]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 