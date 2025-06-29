import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChartType, AutoCompleteSuggestion } from '../types';
import { autoCompleteService } from '../services/firestore';

interface AutoCompleteInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  chartType: ChartType;
  disabled?: boolean;
  className?: string;
}

const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  chartType,
  disabled = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<AutoCompleteSuggestion[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<AutoCompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 자동완성 제안 로드
  const loadSuggestions = async () => {
    if (!name) {
      return;
    }
    
    // chartType이 빈 문자열이면 기본 제안만 표시
    const effectiveChartType = chartType || 'default';
    
    try {
      setLoading(true);
      const suggestions = await autoCompleteService.getSuggestions(name, effectiveChartType, 8);
      setAllSuggestions(suggestions);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('자동완성 제안 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 입력 필드 포커스 시 자동완성 제안 로드
  const handleFocus = () => {
    if (!disabled) {
      loadSuggestions();
      setShowSuggestions(true);
    }
  };

  // 입력 필드 블러 시 자동완성 제안 숨김
  const handleBlur = () => {
    // 약간의 지연을 두어 클릭 이벤트가 처리될 수 있도록 함
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // 자동완성 제안 선택
  const handleSuggestionClick = (suggestion: AutoCompleteSuggestion) => {
    const syntheticEvent = {
      target: {
        name,
        value: suggestion.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    setShowSuggestions(false);
    
    // 선택된 값 저장 (사용 횟수 증가)
    if (chartType && name) {
      autoCompleteService.saveFieldValue(name, suggestion.value, chartType);
    }
  };

  // 입력 값 변경 시 자동완성 제안 필터링
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    
    const inputValue = e.target.value.trim();
    
    if (inputValue) {
      // 입력 값이 있으면 전체 제안에서 필터링
      const filteredSuggestions = allSuggestions.filter(suggestion =>
        suggestion.value.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      // 입력 값이 없으면 모든 제안 표시
      setSuggestions(allSuggestions);
      setShowSuggestions(allSuggestions.length > 0);
    }
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // chartType이나 name이 변경될 때 제안 다시 로드
  useEffect(() => {
    if (name) {
      loadSuggestions();
    }
  }, [chartType, name]);

  // 컴포넌트 마운트 시에도 제안 로드
  useEffect(() => {
    if (name) {
      loadSuggestions();
    }
  }, []);

  return (
    <div className={`autocomplete-container ${className}`}>
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="autocomplete-input"
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="autocomplete-suggestions">
          {loading ? (
            <div className="autocomplete-loading">
              {t('common.loading')}...
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.value}-${index}`}
                className="autocomplete-suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="autocomplete-suggestion-text">
                  {suggestion.value}
                </span>
                <span className="autocomplete-suggestion-count">
                  {suggestion.usageCount}회
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AutoCompleteInput; 