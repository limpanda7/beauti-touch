import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, User, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Reservation, Customer, Product } from '../types';
import { reservationService, customerService, productService } from '../services/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { formatDate } from '../utils/dateUtils';
import { formatDuration } from '../utils/timeUtils';

const ChartsListPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 모든 예약 데이터 로드
      const allReservations = await reservationService.getAll();
      setReservations(allReservations);

      // 고객 정보 로드
      const customerIds = [...new Set(allReservations.map(r => r.customerId))];
      const customersData = await Promise.all(
        customerIds.map(id => customerService.getById(id))
      );
      const customersMap = new Map();
      customersData.forEach(customer => {
        if (customer) {
          customersMap.set(customer.id, customer);
        }
      });
      setCustomers(customersMap);

      // 상품 정보 로드
      const productIds = [...new Set(allReservations.map(r => r.productId))];
      const productsData = await Promise.all(
        productIds.map(id => productService.getById(id))
      );
      const productsMap = new Map();
      productsData.forEach(product => {
        if (product) {
          productsMap.set(product.id, product);
        }
      });
      setProducts(productsMap);
    } catch (error) {
      console.error('차트 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'pending') {
      return !reservation.chartType || !reservation.chartData || Object.keys(reservation.chartData).length === 0;
    } else if (filter === 'completed') {
      return reservation.chartType && reservation.chartData && Object.keys(reservation.chartData).length > 0;
    }
    return true;
  });

  const handleCreateChart = (reservationId: string) => {
    navigate(`/dashboard/chart/${reservationId}`);
  };

  const handleViewChart = (reservationId: string) => {
    navigate(`/dashboard/chart/${reservationId}`);
  };

  const handleViewCustomer = (customerId: string) => {
    navigate(`/dashboard/customers/${customerId}`);
  };

  const getChartStatus = (reservation: Reservation) => {
    if (reservation.chartType && reservation.chartData && Object.keys(reservation.chartData).length > 0) {
      return {
        status: 'completed',
        label: t('chart.status.completed'),
        color: 'var(--color-success)'
      };
    } else {
      return {
        status: 'pending',
        label: t('chart.status.pending'),
        color: 'var(--color-warning)'
      };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <LoadingSpinner fullScreen text={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="charts-list-page">
      <div className="charts-list-header">
        <div className="charts-list-header-left">
          <h1 className="charts-list-title">{t('chart.list.title')}</h1>
          <p className="charts-list-subtitle">{t('chart.list.subtitle')}</p>
        </div>
        <div className="charts-list-header-right">
          {/* 새 예약 버튼 제거됨 */}
        </div>
      </div>

      <div className="charts-list-filters">
        <div className="filter-buttons">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'secondary'}
            size="sm"
          >
            {t('chart.list.filter.all')} ({reservations.length})
          </Button>
          <Button
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'primary' : 'secondary'}
            size="sm"
          >
            {t('chart.list.filter.pending')} ({reservations.filter(r => !r.chartType || !r.chartData || Object.keys(r.chartData).length === 0).length})
          </Button>
          <Button
            onClick={() => setFilter('completed')}
            variant={filter === 'completed' ? 'primary' : 'secondary'}
            size="sm"
          >
            {t('chart.list.filter.completed')} ({reservations.filter(r => r.chartType && r.chartData && Object.keys(r.chartData).length > 0).length})
          </Button>
        </div>
      </div>

      <div className="charts-list-content">
        {filteredReservations.length > 0 ? (
          <div className="charts-grid">
            {filteredReservations.map(reservation => {
              const customer = customers.get(reservation.customerId);
              const product = products.get(reservation.productId);
              const chartStatus = getChartStatus(reservation);

              return (
                <div key={reservation.id} className="chart-card">
                  <div className="chart-card-header">
                    <div className="chart-status-badge" style={{ backgroundColor: chartStatus.color }}>
                      {chartStatus.label}
                    </div>
                    <div className="chart-type-badge">
                      {reservation.chartType ? t(`chart.type.${reservation.chartType}`) : '-'}
                    </div>
                  </div>

                  <div className="chart-card-body">
                    <div className="chart-customer-info">
                      <h3 className="customer-name">
                        {customer?.name || t('common.unknown')}
                      </h3>
                      <p className="customer-phone">
                        {customer?.phone || t('common.unknown')}
                      </p>
                    </div>

                    <div className="chart-reservation-info">
                      <div className="reservation-date">
                        <Calendar style={{ width: '1rem', height: '1rem' }} />
                        <span>{formatDate(new Date(reservation.date), 'day', i18n.language)}</span>
                      </div>
                      <div className="reservation-time">
                        <Clock style={{ width: '1rem', height: '1rem' }} />
                        <span>{reservation.time}</span>
                      </div>
                      <div className="reservation-product">
                        <FileText style={{ width: '1rem', height: '1rem' }} />
                        <span>
                          {reservation.productName}
                          {product && (
                            <span className="product-duration">
                              {' '}({formatDuration(product.duration)})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {reservation.memo && (
                      <div className="chart-memo">
                        <p>{reservation.memo}</p>
                      </div>
                    )}
                  </div>

                  <div className="chart-card-actions">
                    <Button
                      onClick={() => handleViewCustomer(reservation.customerId)}
                      variant="secondary"
                      size="sm"
                    >
                      <User style={{ width: '0.875rem', height: '0.875rem' }} />
                      {t('chart.list.viewCustomer')}
                    </Button>
                    
                    {chartStatus.status === 'pending' ? (
                      <Button
                        onClick={() => handleCreateChart(reservation.id)}
                        variant="primary"
                        size="sm"
                      >
                        <FileText style={{ width: '0.875rem', height: '0.875rem' }} />
                        {t('chart.list.createChart')}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleViewChart(reservation.id)}
                        variant="chart"
                        size="sm"
                      >
                        <ArrowRight style={{ width: '0.875rem', height: '0.875rem' }} />
                        {t('chart.list.viewChart')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="charts-empty">
            <FileText style={{ width: '3rem', height: '3rem', opacity: 0.5 }} />
            <h3>{t('chart.list.noCharts')}</h3>
            <p>{t('chart.list.noChartsDescription')}</p>
            {/* 새 예약 버튼 제거됨 */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartsListPage;
