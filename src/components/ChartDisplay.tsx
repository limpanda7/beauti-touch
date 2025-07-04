import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ChartData, ChartType } from '../types';

interface ChartDisplayProps {
  chartType: ChartType;
  chartData: ChartData;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ chartType, chartData }) => {
  const { t } = useTranslation();

  // 메모 필드를 제외한 차트 데이터 필터링
  const filteredChartData = Object.entries(chartData).filter(([key]) => key !== 'memo');

  if (!chartType || filteredChartData.length === 0) {
    return null;
  }

  // 차트 타입별 필드 정의
  const getChartFields = (type: ChartType) => {
    switch (type) {
      case 'eyelash':
        return [
          { key: 'eyelashType', label: t('chart.fields.eyelashType') },
          { key: 'eyelashDesign', label: t('chart.fields.eyelashDesign') },
          { key: 'eyelashGlue', label: t('chart.fields.eyelashGlue') },
          { key: 'eyelashMaterial', label: t('chart.fields.eyelashMaterial') },
          { key: 'eyelashMix', label: t('chart.fields.eyelashMix') },
          { key: 'eyelashCurl', label: t('chart.fields.eyelashCurl') },
        ];
      case 'waxing':
        return [
          { key: 'waxingArea', label: t('chart.fields.waxingArea') },
          { key: 'waxingSkin', label: t('chart.fields.waxingSkin') },
          { key: 'waxingProduct', label: t('chart.fields.waxingProduct') },
          { key: 'waxingCycle', label: t('chart.fields.waxingCycle') },
          { key: 'waxingHairCondition', label: t('chart.fields.waxingHairCondition') },
          { key: 'waxingPain', label: t('chart.fields.waxingPain') },
          { key: 'waxingAftercare', label: t('chart.fields.waxingAftercare') },
        ];
      case 'nail':
        return [
          { key: 'nailType', label: t('chart.fields.nailType') },
          { key: 'nailColor', label: t('chart.fields.nailColor') },
          { key: 'nailBaseTop', label: t('chart.fields.nailBaseTop') },
          { key: 'nailCondition', label: t('chart.fields.nailCondition') },
          { key: 'nailLength', label: t('chart.fields.nailLength') },
          { key: 'nailArt', label: t('chart.fields.nailArt') },
          { key: 'nailFeedback', label: t('chart.fields.nailFeedback') },
        ];
      case 'skin':
        return [
          { key: 'skinType', label: t('chart.fields.skinType') },
          { key: 'skinTrouble', label: t('chart.fields.skinTrouble') },
          { key: 'skinSensitivity', label: t('chart.fields.skinSensitivity') },
          { key: 'skinPurpose', label: t('chart.fields.skinPurpose') },
          { key: 'skinProduct', label: t('chart.fields.skinProduct') },
        ];
      case 'massage':
        return [
          { key: 'massageArea', label: t('chart.fields.massageArea') },
          { key: 'massageStrength', label: t('chart.fields.massageStrength') },
          { key: 'massagePurpose', label: t('chart.fields.massagePurpose') },
          { key: 'massageMuscle', label: t('chart.fields.massageMuscle') },
          { key: 'massageOil', label: t('chart.fields.massageOil') },
        ];
      default:
        return [];
    }
  };

  const chartFields = getChartFields(chartType);

  // 값이 있는 필드만 필터링
  const filledFields = chartFields.filter(field => 
    chartData[field.key as keyof ChartData] && 
    String(chartData[field.key as keyof ChartData]).trim() !== ''
  );

  if (filledFields.length === 0) {
    return null;
  }

  const getFieldValue = (key: string, value: any) => {
    // 옵션 값인 경우 번역된 텍스트 반환
    const optionKeys = [
      'eyelashType', 'eyelashDesign', 'eyelashCurl',
      'waxingSkin', 'waxingHairCondition', 'waxingPain', 'waxingAftercare',
      'nailType', 'nailBaseTop', 'nailCondition', 'nailLength', 'nailArt',
      'skinType', 'skinSensitivity', 'skinPurpose',
      'massageStrength', 'massagePurpose', 'massageMuscle'
    ];

    if (optionKeys.includes(key)) {
      return t(`chart.options.${key}.${value}`, value);
    }

    return value;
  };

  return (
    <div className="chart-display">
      <h3>{t('chart.title')} - {t(`chart.type.${chartType}`)}</h3>
      <div className="chart-fields">
        {filledFields.map(field => (
          <div key={field.key} className="chart-field">
            <span className="chart-field-label">{field.label}:</span>
            <span className="chart-field-value">
              {getFieldValue(field.key, chartData[field.key as keyof ChartData])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartDisplay; 