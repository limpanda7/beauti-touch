import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Customer, Reservation, ChartType, ChartData, Product } from '../types';
import { customerService, reservationService, productService, autoCompleteService } from '../services/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import CustomerInfo from '../components/CustomerInfo';
import AutoCompleteInput from '../components/AutoCompleteInput';

import { useSettingsStore } from '../stores/settingsStore';
import ChartDrawingTool from '../components/ChartDrawingTool';
import { formatDuration } from '../utils/timeUtils';
import { formatDate } from '../utils/dateUtils';

// Shape 타입 정의 (ChartDrawingTool과 동일하게 맞춤)
type Shape = {
  id: number;
  type: 'circle';
  x: number;
  y: number;
  text?: string;
};

// ChartData 타입 확장: drawings 필드 추가
interface ChartDataWithDrawings extends ChartData {
  drawings?: {
    faceSide: Shape[];
    faceFront: Shape[];
    body: Shape[];
  };
}

const ChartPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { businessType } = useSettingsStore();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 차트 관련 상태
  const [chartType, setChartType] = useState<ChartType>('');
  const [chartData, setChartData] = useState<ChartDataWithDrawings>({});
  const [faceSideShapes, setFaceSideShapes] = useState<Shape[]>([]);
  const [faceFrontShapes, setFaceFrontShapes] = useState<Shape[]>([]);
  const [bodyShapes, setBodyShapes] = useState<Shape[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 브라우저 뒤로가기 및 페이지 새로고침 시 unsaved changes 확인
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = t('chart.unsavedChangesConfirm');
        return t('chart.unsavedChangesConfirm');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, t]);

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
      { name: 'eyelashDesign', label: t('chart.fields.eyelashDesign'), type: 'select', options: ['natural', 'cat', 'doll', 'skinny', 'under', 'honeycomb', 'smoky', 'sweet'] },
      { name: 'eyelashGlue', label: t('chart.fields.eyelashGlue') },
      { name: 'eyelashMaterial', label: t('chart.fields.eyelashMaterial') },
      { name: 'eyelashMix', label: t('chart.fields.eyelashMix') },
      { name: 'eyelashCurl', label: t('chart.fields.eyelashCurl'), type: 'select', options: ['J', 'B', 'C', 'CC', 'D', 'DD', 'L', 'LD'] },
    ],
    waxing: [
      { name: 'waxingArea', label: t('chart.fields.waxingArea') },
      { name: 'waxingSkin', label: t('chart.fields.waxingSkin'), type: 'select', options: ['sensitive', 'dry', 'oily', 'trouble', 'normal'] },
      { name: 'waxingProduct', label: t('chart.fields.waxingProduct') },
      { name: 'waxingCycle', label: t('chart.fields.waxingCycle') },
      { name: 'waxingHairCondition', label: t('chart.fields.waxingHairCondition'), type: 'select', options: ['uniform', 'thick', 'thin', 'sparse', 'clumped'] },
      { name: 'waxingPain', label: t('chart.fields.waxingPain'), type: 'select', options: ['sensitive', 'normal', 'none'] },
      { name: 'waxingAftercare', label: t('chart.fields.waxingAftercare'), type: 'select', options: ['soothing_gel', 'cream', 'cold_compress', 'skin', 'lotion', 'none'] },
    ],
    nail: [
      { name: 'nailType', label: t('chart.fields.nailType'), type: 'select', options: ['care', 'gel', 'art', 'remove'] },
      { name: 'nailColor', label: t('chart.fields.nailColor') },
      { name: 'nailBaseTop', label: t('chart.fields.nailBaseTop'), type: 'select', options: ['both', 'base_only', 'top_only', 'neither'] },
      { name: 'nailCondition', label: t('chart.fields.nailCondition'), type: 'select', options: ['thin', 'split', 'healthy', 'lifting', 'discolored'] },
      { name: 'nailLength', label: t('chart.fields.nailLength'), type: 'select', options: ['short', 'medium', 'long'] },
      { name: 'nailArt', label: t('chart.fields.nailArt'), type: 'select', options: ['yes', 'no'] },
      { name: 'nailFeedback', label: t('chart.fields.nailFeedback') },
    ],
    skin: [
      { name: 'skinType', label: t('chart.fields.skinType'), type: 'select', options: ['normal', 'dry', 'oily', 'combination', 'sensitive'] },
      { name: 'skinTypeDetail', label: t('chart.fields.skinTypeDetail') },
      { name: 'skinTrouble', label: t('chart.fields.skinTrouble') },
      { name: 'skinSensitivity', label: t('chart.fields.skinSensitivity'), type: 'select', options: ['tingle', 'hot', 'redness', 'none'] },
      { name: 'skinPurpose', label: t('chart.fields.skinPurpose'), type: 'select', options: ['soothing', 'moisturizing', 'whitening', 'trouble', 'elasticity', 'regeneration', 'exfoliation'] },
      { name: 'skinProduct', label: t('chart.fields.skinProduct') },
    ],
    massage: [
      { name: 'massageArea', label: t('chart.fields.massageArea') },
      { name: 'massageStrength', label: t('chart.fields.massageStrength'), type: 'select', options: ['weak', 'medium', 'strong'] },
      { name: 'massagePurpose', label: t('chart.fields.massagePurpose'), type: 'select', options: ['pain_relief', 'circulation', 'fatigue_recovery', 'swelling_reduction', 'body_shape'] },
      { name: 'massageMuscle', label: t('chart.fields.massageMuscle'), type: 'select', options: ['normal', 'knots', 'tension', 'lack_elasticity'] },
      { name: 'massageOil', label: t('chart.fields.massageOil') },
    ],
    default: [], // 기본 타입은 빈 배열
    '': [],
  };

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
        setChartType(reservationData.chartType || businessType || '');
        setChartData(reservationData.chartData || {});
        // 도형 정보 복원
        const drawings = (reservationData.chartData as ChartDataWithDrawings)?.drawings as any || {};
        setFaceSideShapes(drawings.faceSide || []);
        setFaceFrontShapes(drawings.faceFront || []);
        setBodyShapes(drawings.body || []);
        
        // 고객 정보도 로드
        const customerData = await customerService.getById(reservationData.customerId);
        setCustomer(customerData);
        
        // 상품 정보도 로드
        const productData = await productService.getById(reservationData.productId);
        setProduct(productData);
        
        // 데이터 로드 완료 후 unsaved changes 플래그 리셋
        setHasUnsavedChanges(false);
      } else {
        navigate('/dashboard/reservations');
      }
    } catch (error) {
      console.error(t('chart.loadError'), error);
      navigate('/dashboard/reservations');
    } finally {
      setLoading(false);
    }
  };

  // 차트 타입 변경 핸들러
  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartType(e.target.value as ChartType);
    setChartData({}); // 업종 변경 시 세부 입력 초기화
    setHasUnsavedChanges(true);
  };

  // 차트 데이터 변경 핸들러
  const handleChartDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 차트 데이터 필드들
    if (chartType && chartFieldDefs[chartType]?.some(field => field.name === name)) {
      setChartData(prev => ({ ...prev, [name]: value }));
      setHasUnsavedChanges(true);
    }
  };

  // 도형 변경 시 unsaved changes 플래그 설정
  const handleFaceSideShapesChange: React.Dispatch<React.SetStateAction<Shape[]>> = (shapes) => {
    setFaceSideShapes(shapes);
    setHasUnsavedChanges(true);
  };

  const handleFaceFrontShapesChange: React.Dispatch<React.SetStateAction<Shape[]>> = (shapes) => {
    setFaceFrontShapes(shapes);
    setHasUnsavedChanges(true);
  };

  const handleBodyShapesChange: React.Dispatch<React.SetStateAction<Shape[]>> = (shapes) => {
    setBodyShapes(shapes);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!reservation) return;
    
    setSaving(true);
    try {
      if (chartType) {
        const savePromises = Object.entries(chartData)
          .filter(([_, value]) => typeof value === 'string' && value.trim())
          .map(([fieldName, fieldValue]) => 
            autoCompleteService.saveFieldValue(fieldName, (fieldValue as string).trim(), chartType)
          );
        
        await Promise.all(savePromises);
      }
      // 도형 정보 포함
      const newChartData = {
        ...chartData,
        drawings: {
          faceSide: faceSideShapes,
          faceFront: faceFrontShapes,
          body: bodyShapes,
        },
      };
      await reservationService.update(reservation.id, {
        chartType,
        chartData: newChartData,
        status: 'completed',
      });
      setHasUnsavedChanges(false);
      alert(t('common.saveSuccess'));
      navigate(-1); // 이전 페이지로 돌아가기
    } catch (error) {
      console.error(t('chart.saveError'), error);
      alert(t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm(t('chart.unsavedChangesConfirm'))) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
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
      {/* SEO 메타 태그 */}
      {/*
      <SEO 
        title={`${t('chart.title')} - ${t('navigation.pageTitle')}`}
        description={t('chart.createChart')}
        keywords={t('navigation.seoKeywords.chart')}
      />
      */}
      
      <div className="chart-page-header">
        <div className="chart-page-header-left">
          <Button
            onClick={handleCancel}
            variant="icon"
            className="back-icon-btn"
          >
            <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
          </Button>
        </div>
        <div className="chart-page-header-center">
          <h1 className="chart-page-title">{t('chart.createChart')}</h1>
        </div>
        <div className="chart-page-btn-group">
          <Button
            onClick={handleCancel}
            variant="secondary"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            variant="primary"
          >
            <Save style={{ width: '1rem', height: '1rem' }} />
            {t('common.save')}
          </Button>
        </div>
      </div>

      {/* 고객 정보 섹션 */}
      <div className="chart-page-customer-info">
        <h2 className="chart-page-section-title">{t('customers.customerInfo')}</h2>
        <CustomerInfo customer={customer} />
      </div>

      {/* 차트 입력 섹션 */}
      <div className="chart-page-chart-info">
        <div className="chart-page-time-info">
          <p className="chart-page-time-text">
            {formatDate(new Date(reservation.date), 'day', i18n.language)} {reservation.time}
          </p>
          <p className="chart-page-product-text">
            {reservation.productName}
            {product && (
              <span className="chart-page-duration">
                {' '}({formatDuration(product.duration)})
              </span>
            )}
          </p>
        </div>
        <div className="chart-page-section-header">
          <div className="chart-page-type-select">
            <label htmlFor="chartType">{t('chart.type.label')}:</label>
            <select
              id="chartType"
              value={chartType}
              onChange={handleChartTypeChange}
            >
              {chartTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {chartType && (
          <div className="chart-page-fields-grid">
            {chartFieldDefs[chartType].map(field => (
              <div key={field.name} className="form-group">
                <label htmlFor={field.name}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={chartData[field.name] as string || ''}
                    onChange={handleChartDataChange}
                  >
                    <option value="">-</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{t(`chart.options.${field.name}.${opt}`, opt)}</option>
                    ))}
                  </select>
                ) : (
                  <AutoCompleteInput
                    key={`${field.name}-${chartType}`}
                    id={field.name}
                    name={field.name}
                    value={chartData[field.name] as string || ''}
                    onChange={handleChartDataChange}
                    chartType={chartType}
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 차트 드로잉 도구 (SVG 기반) */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div>
          <ChartDrawingTool imageUrl="/chart-templates/face-side.png" width={300} height={300} shapes={faceSideShapes} setShapes={handleFaceSideShapesChange} />
        </div>
        <div>
          <ChartDrawingTool imageUrl="/chart-templates/face-front.png" width={300} height={300} shapes={faceFrontShapes} setShapes={handleFaceFrontShapesChange} />
        </div>
        <div>
          <ChartDrawingTool imageUrl="/chart-templates/body.png" width={300} height={300} shapes={bodyShapes} setShapes={handleBodyShapesChange} />
        </div>
      </div>
    </div>
  );
};

export default ChartPage; 