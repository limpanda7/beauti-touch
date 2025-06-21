import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Customer, Reservation, ChartType, ChartData, ChartCommon } from '../types';
import { customerService, reservationService } from '../services/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

const ChartPage: React.FC = () => {
  const { t } = useTranslation();
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 차트 관련 상태
  const [chartType, setChartType] = useState<ChartType>('');
  const [chartData, setChartData] = useState<ChartData>({});
  const [chartCommon, setChartCommon] = useState<ChartCommon>({});

  // 차트 타입 옵션
  const chartTypeOptions = [
    { value: '', label: '-' },
    { value: 'eyelash', label: t('chart.type.eyelash') },
    { value: 'waxing', label: t('chart.type.waxing') },
    { value: 'nail', label: t('chart.type.nail') },
    { value: 'skin', label: t('chart.type.skin') },
    { value: 'massage', label: t('chart.type.massage') },
  ];

  // 차트 필드 정의
  const chartFieldDefs: Record<ChartType, { name: keyof ChartData; label: string; type?: string; options?: string[] }[]> = {
    eyelash: [
      { name: 'eyelashType', label: t('chart.fields.eyelashType'), type: 'select', options: ['extension', 'perm', 'remove'] },
      { name: 'eyelashMaterial', label: t('chart.fields.eyelashMaterial') },
      { name: 'eyelashMix', label: t('chart.fields.eyelashMix') },
      { name: 'eyelashDesign', label: t('chart.fields.eyelashDesign'), type: 'select', options: ['cat', 'doll', 'natural'] },
      { name: 'eyelashGlue', label: t('chart.fields.eyelashGlue') },
      { name: 'eyelashFeedback', label: t('chart.fields.eyelashFeedback') },
    ],
    waxing: [
      { name: 'waxingArea', label: t('chart.fields.waxingArea') },
      { name: 'waxingCycle', label: t('chart.fields.waxingCycle') },
      { name: 'waxingSkin', label: t('chart.fields.waxingSkin'), type: 'select', options: ['sensitive', 'dry', 'trouble'] },
      { name: 'waxingProduct', label: t('chart.fields.waxingProduct') },
      { name: 'waxingPain', label: t('chart.fields.waxingPain'), type: 'select', options: ['sensitive', 'normal', 'none'] },
      { name: 'waxingAftercare', label: t('chart.fields.waxingAftercare') },
    ],
    nail: [
      { name: 'nailType', label: t('chart.fields.nailType'), type: 'select', options: ['care', 'gel', 'art', 'remove'] },
      { name: 'nailColor', label: t('chart.fields.nailColor') },
      { name: 'nailBaseTop', label: t('chart.fields.nailBaseTop') },
      { name: 'nailCondition', label: t('chart.fields.nailCondition'), type: 'select', options: ['thin', 'split', 'healthy'] },
      { name: 'nailFeedback', label: t('chart.fields.nailFeedback') },
    ],
    skin: [
      { name: 'skinTypeDetail', label: t('chart.fields.skinTypeDetail'), type: 'select', options: ['oily', 'dry', 'combination', 'sensitive'] },
      { name: 'skinPurpose', label: t('chart.fields.skinPurpose') },
      { name: 'skinTrouble', label: t('chart.fields.skinTrouble') },
      { name: 'skinSensitivity', label: t('chart.fields.skinSensitivity'), type: 'select', options: ['tingle', 'none'] },
      { name: 'skinFeedback', label: t('chart.fields.skinFeedback') },
    ],
    massage: [
      { name: 'massageArea', label: t('chart.fields.massageArea') },
      { name: 'massageStrength', label: t('chart.fields.massageStrength'), type: 'select', options: ['weak', 'medium', 'strong'] },
      { name: 'massagePreference', label: t('chart.fields.massagePreference') },
      { name: 'massageMuscle', label: t('chart.fields.massageMuscle') },
    ],
    '': [],
  };

  // 차트 공통 필드
  const chartCommonFields: { name: keyof ChartCommon; label: string }[] = [
    { name: 'visitCycle', label: t('chart.fields.visitCycle') },
    { name: 'usedDevice', label: t('chart.fields.usedDevice') },
    { name: 'usedProduct', label: t('chart.fields.usedProduct') },
    { name: 'caution', label: t('chart.fields.caution') },
  ];

  useEffect(() => {
    loadData();
  }, [reservationId]);

  const loadData = async () => {
    if (!reservationId) return;
    
    try {
      setLoading(true);
      const reservationData = await reservationService.getById(reservationId);
      if (reservationData) {
        setReservation(reservationData);
        setChartType(reservationData.chartType || '');
        setChartData(reservationData.chartData || {});
        setChartCommon(reservationData.chartCommon || {});
        
        // 고객 정보도 로드
        const customerData = await customerService.getById(reservationData.customerId);
        setCustomer(customerData);
      } else {
        navigate('/reservations');
      }
    } catch (error) {
      console.error('차트 정보를 불러오는데 실패했습니다:', error);
      navigate('/reservations');
    } finally {
      setLoading(false);
    }
  };

  // 차트 타입 변경 핸들러
  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartType(e.target.value as ChartType);
    setChartData({}); // 업종 변경 시 세부 입력 초기화
  };

  // 차트 데이터 변경 핸들러
  const handleChartDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 차트 데이터 필드들
    if (chartType && chartFieldDefs[chartType]?.some(field => field.name === name)) {
      setChartData(prev => ({ ...prev, [name]: value }));
    }
    // 차트 공통 필드들
    else if (chartCommonFields.some(field => field.name === name)) {
      setChartCommon(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!reservation) return;
    
    setSaving(true);
    try {
      await reservationService.update(reservation.id, {
        chartType,
        chartData,
        chartCommon,
      });
      alert(t('common.saveSuccess'));
      navigate(-1); // 이전 페이지로 돌아가기
    } catch (error) {
      console.error('차트 정보 저장에 실패했습니다:', error);
      alert(t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <LoadingSpinner fullScreen text={t('common.loading')} />
      </div>
    );
  }

  if (!customer || !reservation) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6B7280' }}>
        {t('common.notFound')}
      </div>
    );
  }

  return (
    <div className="chart-page">
      <div className="chart-page-header">
        <div className="chart-page-header-left">
          <button
            onClick={handleCancel}
            className="chart-page-back-icon"
          >
            <ArrowLeft style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>
        <div className="chart-page-header-center">
          <h1 className="chart-page-title">차트 작성</h1>
          <p className="chart-page-subtitle">
            {customer.name} - {new Date(reservation.date).toLocaleDateString('ko-KR')} {reservation.time}
          </p>
        </div>
        <div className="chart-page-btn-group">
          <button
            onClick={handleCancel}
            className="chart-page-btn chart-page-btn-cancel"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="chart-page-btn chart-page-btn-save"
          >
            <Save style={{ width: '1rem', height: '1rem' }} />
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {/* 고객 정보 섹션 */}
      <div className="chart-page-customer-info">
        <h2 className="chart-page-section-title">고객 정보</h2>
        <div className="chart-page-customer-grid">
          <div className="chart-page-customer-section">
            <h3 className="chart-page-subsection-title">{t('customers.basicInfo')}</h3>
            <div className="chart-page-info-list">
              <div className="chart-page-info-item">
                <span className="chart-page-info-label">{t('customers.name')}:</span>
                <span className="chart-page-info-value">{customer.name}</span>
              </div>
              <div className="chart-page-info-item">
                <span className="chart-page-info-label">{t('customers.phone')}:</span>
                <span className="chart-page-info-value">{customer.phone}</span>
              </div>
              <div className="chart-page-info-item">
                <span className="chart-page-info-label">{t('customers.gender')}:</span>
                <span className="chart-page-info-value">
                  {customer?.gender ? t(`customers.genders.${customer.gender}`) : '-'}
                </span>
              </div>
              <div className="chart-page-info-item">
                <span className="chart-page-info-label">{t('customers.age')}:</span>
                <span className="chart-page-info-value">{customer.age || '-'}</span>
              </div>
            </div>
          </div>
          
          <div className="chart-page-customer-section">
            <h3 className="chart-page-subsection-title">{t('customers.detailInfo')}</h3>
            <div className="chart-page-info-list">
              <div className="chart-page-info-item">
                <span className="chart-page-info-label">{t('customers.skinType')}:</span>
                <span className="chart-page-info-value">
                  {customer?.skinType ? t(`customers.skinTypes.${customer.skinType}`) : '-'}
                </span>
              </div>
              <div className="chart-page-info-item">
                <span className="chart-page-info-label">{t('customers.allergies')}:</span>
                <span className="chart-page-info-value">{customer?.allergies || '-'}</span>
              </div>
              <div className="chart-page-info-item">
                <span className="chart-page-info-label">{t('customers.memo')}:</span>
                <span className="chart-page-info-value">{customer?.memo || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 정보 섹션 */}
      <div className="chart-page-chart-section">
        <h2 className="chart-page-section-title">차트 정보</h2>
        
        <div className="chart-page-form">
          <div className="form-group">
            <label htmlFor="chartType">업종(시술 종류)</label>
            <select
              id="chartType"
              name="chartType"
              value={chartType}
              onChange={handleChartTypeChange}
            >
              {chartTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 업종별 세부 입력란 */}
          {chartType && (
            <div className="chart-page-fields">
              <h3 className="chart-page-subsection-title">세부 정보</h3>
              <div className="chart-page-fields-grid">
                {chartFieldDefs[chartType].map(field => (
                  <div key={field.name} className="form-group">
                    <label htmlFor={field.name}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        id={field.name}
                        name={field.name}
                        value={chartData[field.name] || ''}
                        onChange={handleChartDataChange}
                      >
                        <option value="">-</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{t(`chart.options.${field.name}.${opt}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        id={field.name}
                        name={field.name}
                        value={chartData[field.name] || ''}
                        onChange={handleChartDataChange}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 공통 항목 */}
          <div className="chart-page-fields">
            <h3 className="chart-page-subsection-title">공통 정보</h3>
            <div className="chart-page-fields-grid">
              {chartCommonFields.map(field => (
                <div key={field.name} className="form-group">
                  <label htmlFor={field.name}>{field.label}</label>
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={chartCommon[field.name] || ''}
                    onChange={handleChartDataChange}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartPage; 