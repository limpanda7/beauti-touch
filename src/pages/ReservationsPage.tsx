import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addMonths,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { ko, enUS, es, pt, th, vi } from 'date-fns/locale';
import type { Reservation, Product } from '../types';
import { reservationService, productService } from '../services/firestore';
import ReservationModal from '../components/ReservationModal';
import LoadingSpinner from '../components/LoadingSpinner';

import { useCurrencyFormat } from '../utils/currency';
import { getTimeRange, formatDuration } from '../utils/timeUtils';
import { useUIStore } from '../stores/uiStore';
import { 
  formatDate, 
  formatDateRange, 
  formatWeekday, 
  formatDayNumber 
} from '../utils/dateUtils';
import { useAuthStore } from '../stores/authStore';

type ViewType = 'month' | 'week' | 'day';

const ReservationsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const { isMobile, shouldOpenReservationModal, resetReservationModal } = useUIStore();
  const { user, isInitialized } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [initialCustomerIdForModal, setInitialCustomerIdForModal] = useState<string | undefined>(undefined);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date());

  // 스와이프 제스처를 위한 터치 이벤트 처리
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeFeedback, setSwipeFeedback] = useState<'left' | 'right' | null>(null);

  const minSwipeDistance = 50;

  // 마지막으로 본 뷰 상태를 localStorage에서 복원
  useEffect(() => {
    const savedView = localStorage.getItem('reservationsLastView');
    
    if (savedView && ['month', 'week', 'day'].includes(savedView)) {
      setView(savedView as ViewType);
    } else {
      setView('week'); // 기본값을 주 보기로 변경
    }
    
    // 날짜는 항상 오늘로 설정
    setCurrentDate(new Date());
    
    // 모바일 일간 뷰에서는 항상 오늘 날짜를 기본으로 설정
    setSelectedDay(new Date());
  }, []);

  // 플로팅 버튼 클릭 감지
  useEffect(() => {
    if (shouldOpenReservationModal) {
      handleOpenModal(null);
      resetReservationModal();
    }
  }, [shouldOpenReservationModal, resetReservationModal]);

  // 뷰가 변경될 때마다 localStorage에 저장 (날짜 제외)
  useEffect(() => {
    if (view === null) {
      return;
    }
    
    localStorage.setItem('reservationsLastView', view);
  }, [view]);

  // 상품 정보를 ID로 빠르게 찾기 위한 Map
  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(product => {
      map.set(product.id, product);
    });
    return map;
  }, [products]);

  // 상품의 시간을 포맷팅하는 함수
  const formatProductDuration = (duration: number): string => {
    return formatDuration(duration);
  };

  // 예약의 시간 범위를 계산하는 함수
  const getReservationTimeRange = (reservation: Reservation): string => {
    const product = productsMap.get(reservation.productId);
    if (product && product.duration) {
      return getTimeRange(reservation.time, product.duration);
    }
    return reservation.time; // 상품 정보가 없으면 원래 시간 반환
  };

  // 캘린더에서 표시할 예약 정보를 포맷팅하는 함수
  const formatReservationForCalendar = (reservation: Reservation): { timeAndCustomer: string; productAndDuration: string } => {
    const product = productsMap.get(reservation.productId);
    const timeAndCustomer = `${reservation.time} ${reservation.customerName}`;
    
    let productAndDuration = reservation.productName;
    if (product && product.duration) {
      const durationText = formatProductDuration(product.duration);
      productAndDuration = `${reservation.productName} (${durationText})`;
    }
    
    return { timeAndCustomer, productAndDuration };
  };

  // 스와이프 제스처 이벤트 핸들러들
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setSwipeFeedback('left');
      changeDate('next');
    } else if (isRightSwipe) {
      setSwipeFeedback('right');
      changeDate('prev');
    }
    
    setTimeout(() => setSwipeFeedback(null), 300);
  };

  // 모바일에서 스와이프 힌트 표시
  useEffect(() => {
    if (isMobile && view && (view === 'month' || view === 'week')) {
      setShowSwipeHint(true);
      setTimeout(() => {
        setShowSwipeHint(false);
      }, 4000);
    }
  }, [isMobile, view]);

  const getDateRangeAndHeader = useMemo(() => {
    let start: Date;
    let end: Date;
    let text: string;
    
    // view가 null이면 기본값으로 month 사용
    const currentView = view || 'month';
    
    switch (currentView) {
      case 'week':
        start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
        end = endOfWeek(currentDate, { weekStartsOn: 0 });
        text = formatDateRange(start, end, i18n.language);
        break;
      case 'day':
        // 일간 뷰에서는 주간 범위를 표시 (6.1 - 6.7 형태)
        start = startOfWeek(currentDate, { weekStartsOn: 0 });
        end = endOfWeek(currentDate, { weekStartsOn: 0 });
        text = formatDateRange(start, end, i18n.language);
        break;
      case 'month':
      default:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        text = formatDate(currentDate, 'month', i18n.language);
        break;
    }
    
    return { 
      dateRange: { start, end }, 
      headerText: text 
    };
  }, [currentDate, view, i18n.language]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getByDateRange(getDateRangeAndHeader.dateRange.start, getDateRangeAndHeader.dateRange.end);
      setReservations(data);
    } catch (error) {
      console.error(t('reservations.loadError'), error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error(t('reservations.productLoadError'), error);
    }
  };

  useEffect(() => {
    // 인증 상태가 초기화되고 사용자가 로그인된 경우에만 데이터 로드
    if (isInitialized && user && user.uid) {
      console.log('인증 상태 확인됨, 데이터 로드 시작:', { user: user.uid, isInitialized });
      
      // 약간의 지연을 두어 Firebase Auth 상태가 완전히 동기화되도록 함
      const timer = setTimeout(() => {
        loadReservations();
        loadProducts();
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (isInitialized && !user) {
      console.log('인증 상태 확인됨, 사용자가 로그인되지 않음');
      setLoading(false);
    } else {
      console.log('인증 상태 초기화 중...');
    }
  }, [getDateRangeAndHeader, isInitialized, user]);

  const handleOpenModal = (reservation: Reservation | null, date?: Date) => {
    setEditingReservation(reservation);
    setSelectedDateForModal(date || reservation?.date || currentDate);
    setInitialCustomerIdForModal(undefined);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReservation(null);
    setSelectedDateForModal(null);
  };

  const handleSaveModal = (savedReservation: Reservation) => {
    handleCloseModal();
    loadReservations();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('reservations.deleteConfirm'))) {
      try {
        await reservationService.delete(id);
        await loadReservations();
      } catch (error) {
        console.error(t('reservations.deleteError'), error);
      }
    }
  };

  const changeDate = (direction: 'prev' | 'next') => {
    const modifier = direction === 'prev' ? -1 : 1;
    const currentView = view || 'month'; // view가 null이면 기본값 사용
    
    switch (currentView) {
      case 'week':
        setCurrentDate(addDays(currentDate, 7 * modifier));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1 * modifier));
        break;
      case 'month':
      default:
        setCurrentDate(addMonths(currentDate, 1 * modifier));
        break;
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dayNames = [t('calendar.days.sun'), t('calendar.days.mon'), t('calendar.days.tue'), t('calendar.days.wed'), t('calendar.days.thu'), t('calendar.days.fri'), t('calendar.days.sat')];

      return renderMobileMonthView(days, dayNames);
  };

  const renderMobileMonthView = (days: Date[], dayNames: string[]) => {
    return (
      <div className="calendar-mobile-container">
        {showSwipeHint && (
          <div className="swipe-hint">
            <span>{t('reservations.swipeHint')}</span>
          </div>
        )}
        
        {swipeFeedback && (
          <div className={`swipe-feedback ${swipeFeedback}`}>
            {swipeFeedback === 'left' ? t('reservations.nextMonth') : t('reservations.prevMonth')}
          </div>
        )}
        
        <div 
          className={`calendar-mobile ${swipeFeedback ? `swipe-${swipeFeedback}` : ''}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="calendar-mobile-header">
            {dayNames.map(name => (
              <div key={name} className="calendar-mobile-day-name">{name}</div>
            ))}
          </div>
          
          <div className="calendar-mobile-grid">
            {days.map((day, index) => {
              const reservationsForDay = reservations.filter(r => isSameDay(r.date, day));
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <div
                  key={index}
                  className={`calendar-mobile-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleOpenModal(null, day)}
                >
                  <div className="calendar-mobile-day-number">
                    {formatDayNumber(day, i18n.language)}
                  </div>
                  
                  <div className="calendar-mobile-events">
                    {reservationsForDay.slice(0, 3).map((res, resIndex) => {
                      return (
                        <div 
                          key={res.id} 
                          className={`calendar-mobile-event ${res.status}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(res);
                          }}
                        >
                          <span className="event-product">{res.productName}</span>
                        </div>
                      );
                    })}
                    
                    {reservationsForDay.length > 3 && (
                      <div className="calendar-mobile-more-events">
                        +{reservationsForDay.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 0 }) });
    
    // 모바일과 PC 모두 동일한 주간 뷰 구조 사용 (한 주를 한눈에 볼 수 있는 구조)
    return (
      <div className="calendar-week-mobile-container">
        <div 
          className="calendar-week-mobile"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="calendar-week-mobile-header">
            {days.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={index} className={`calendar-week-mobile-day-header ${isToday ? 'today' : ''}`}>
                  <span className="calendar-week-mobile-day-name">
                    {formatWeekday(day, i18n.language)}
                  </span>
                  <span className={`calendar-week-mobile-day-number ${isToday ? 'today' : ''}`}>
                    {formatDayNumber(day, i18n.language)}
                  </span>
                </div>
              );
            })}
          </div>
        
          <div className="calendar-week-mobile-grid">
            {days.map((day, dayIndex) => {
              const reservationsForDay = reservations.filter(r => isSameDay(r.date, day));
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={dayIndex}
                  className={`calendar-week-mobile-day-slot ${isToday ? 'today' : ''}`}
                  onClick={() => handleOpenModal(null, day)}
                >
                  {reservationsForDay.map((res) => {
                    const { timeAndCustomer, productAndDuration } = formatReservationForCalendar(res);
                    return (
                      <div 
                        key={res.id} 
                        className={`calendar-week-mobile-event ${res.status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(res);
                        }}
                      >
                        <span className="event-time">{timeAndCustomer}</span>
                        <span className="event-product">{productAndDuration}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  const renderDayView = () => {
    // 모바일 일간 뷰는 기존 모바일 주간 뷰의 구조를 그대로 사용 (상단 날짜탭 + 하단 당일내용)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 0 }) });
    const reservationsForSelectedDay = reservations.filter(r => isSameDay(r.date, selectedDay));
    const isTodaySelected = isSameDay(selectedDay, new Date());

    return (
      <div className="calendar-week-mobile-container">
        <div 
          className="calendar-week-mobile day-view"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="calendar-week-mobile-header">
            {days.map((day) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDay);
              return (
                <div 
                  key={day.toString()} 
                  className={`calendar-week-mobile-day-header ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span className="calendar-week-mobile-day-name">
                    {formatWeekday(day, i18n.language)}
                  </span>
                  <span className={`calendar-week-mobile-day-number ${isToday ? 'today' : ''}`}>
                    {formatDayNumber(day, i18n.language)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="reservations-day-view">
            {reservationsForSelectedDay.length === 0 ? (
              <div className="reservations-day-empty">{t('reservations.noReservations')}</div>
            ) : (
              reservationsForSelectedDay.map(reservation => {
                const { timeAndCustomer, productAndDuration } = formatReservationForCalendar(reservation);
                return (
                  <div key={reservation.id} className={`reservations-day-item ${reservation.status}`}
                    onClick={() => handleOpenModal(reservation)}
                  >
                    <div>
                      <p className="reservations-day-item-time">{timeAndCustomer}</p>
                      <p className="reservations-day-item-product">{productAndDuration}</p>
                    </div>
                    <div className="reservations-day-item-details">
                      <span className={`reservation-status ${reservation.status}`}>{t(`reservations.status${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}`)}</span>
                      {reservation.memo && <p className="reservations-day-item-memo">{reservation.memo}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // 현재 날짜가 변경되면 선택된 날짜도 업데이트
  useEffect(() => {
    setSelectedDay(currentDate);
  }, [currentDate]);

  if (view === null) {
    return (
      <div className="content-wrapper">
        <LoadingSpinner fullScreen text={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      {/* 모바일에서는 헤더 숨김 */}
      {!isMobile && (
        <div className="page-header">
          <h1>{t('reservations.title')}</h1>
          <button
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary"
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            {t('reservations.newReservation')}
          </button>
        </div>
      )}

      <div className={`card ${view === 'month' || view === 'week' ? 'calendar-card' : ''}`}>
        <div className="page-header">
          <div className="reservations-header">
            {!isMobile && (
              <>
                <button
                  onClick={() => changeDate('prev')}
                  className="btn btn-icon"
                  disabled={loading}
                >
                  <ChevronLeft style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
                <h2 className="reservations-header-title">{getDateRangeAndHeader.headerText}</h2>
                <button
                  onClick={() => changeDate('next')}
                  className="btn btn-icon"
                  disabled={loading}
                >
                  <ChevronRight style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
                <button
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDay(new Date());
                  }}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  {t('reservations.today')}
                </button>
              </>
            )}
            {isMobile && (
              <>
                <div className="month-nav-group">
                  <button
                    onClick={() => changeDate('prev')}
                    className="btn btn-icon btn-nav"
                    disabled={loading}
                  >
                    <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  <h2 className="reservations-header-title">{getDateRangeAndHeader.headerText}</h2>
                  <button
                    onClick={() => changeDate('next')}
                    className="btn btn-icon btn-nav"
                    disabled={loading}
                  >
                    <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="reservations-header-btns">
            <button
              onClick={() => setView('month')}
              className={`btn ${view === 'month' ? 'btn-primary' : 'btn-secondary'}`}
              disabled={loading}
            >
              {t('reservations.month')}
            </button>
            <button
              onClick={() => setView('week')}
              className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              disabled={loading}
            >
              {t('reservations.week')}
            </button>
            <button
              onClick={() => setView('day')}
              className={`btn ${view === 'day' ? 'btn-primary' : 'btn-secondary'}`}
              disabled={loading}
            >
              {t('reservations.day')}
            </button>
          </div>
        </div>

        <div className={`calendar-container ${view === 'month' || view === 'week' ? 'full-width' : ''} ${loading ? 'loading' : ''}`}>
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>
      </div>

      {loading && <LoadingSpinner fullScreen text={t('common.loading')} />}

      {isModalOpen && (
        <ReservationModal
          reservation={editingReservation}
          initialDate={selectedDateForModal}
          initialCustomerId={initialCustomerIdForModal}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
          onDelete={async (id: string) => {
            await reservationService.delete(id);
            handleCloseModal();
            await loadReservations();
          }}
        />
      )}

      {/* 모바일에서 오늘이 아닌 날짜를 볼 때 Today 버튼 표시 */}
      {isMobile && (
        (view === 'month' && !isSameMonth(currentDate, new Date())) ||
        (view === 'week' && !isSameDay(currentDate, new Date()) && !isSameDay(startOfWeek(currentDate, { weekStartsOn: 0 }), startOfWeek(new Date(), { weekStartsOn: 0 }))) ||
        (view === 'day' && !isSameDay(selectedDay, new Date()))
      ) && (
        <button 
          className="floating-today-button"
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedDay(new Date());
          }}
          aria-label={t('reservations.today')}
        >
          {t('reservations.today')}
        </button>
      )}
    </div>
  );
};

export default ReservationsPage; 