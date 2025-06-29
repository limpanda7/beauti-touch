import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_NAMES,
  type SupportedLanguage 
} from '../utils/languageUtils';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
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

  const handleLanguageChange = (language: SupportedLanguage) => {
    i18n.changeLanguage(language);
    setIsOpen(false);
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