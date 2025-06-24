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
import { ko } from 'date-fns/locale';
import type { Reservation, Product } from '../types';
import { reservationService, productService } from '../services/firestore';
import ReservationModal from '../components/ReservationModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrencyFormat } from '../utils/currency';
import { getTimeRange } from '../utils/timeUtils';

type ViewType = 'month' | 'week' | 'day';

const ReservationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [initialCustomerIdForModal, setInitialCustomerIdForModal] = useState<string | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);
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
    
    // 모바일 주 보기에서는 항상 오늘 날짜를 기본으로 설정
    // (다른 페이지 갔다가 돌아오거나 새로고침 시 오늘 날짜가 기본)
    setSelectedDay(new Date());
  }, []);

  // 현재 날짜가 변경되면 선택된 날짜도 업데이트
  useEffect(() => {
    setSelectedDay(currentDate);
  }, [currentDate]);

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
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}${t('reservations.hour')} ${minutes}${t('reservations.minute')}`;
    } else if (hours > 0) {
      return `${hours}${t('reservations.hour')}`;
    } else {
      return `${minutes}${t('reservations.minute')}`;
    }
  };

  // 예약의 시간 범위를 계산하는 함수
  const getReservationTimeRange = (reservation: Reservation): string => {
    const product = productsMap.get(reservation.productId);
    if (product && product.duration) {
      return getTimeRange(reservation.time, product.duration);
    }
    return reservation.time; // 상품 정보가 없으면 원래 시간 반환
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeFeedback(null);
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
      setTimeout(() => {
        changeDate('next');
        setSwipeFeedback(null);
      }, 150);
    }
    if (isRightSwipe) {
      setSwipeFeedback('right');
      setTimeout(() => {
        changeDate('prev');
        setSwipeFeedback(null);
      }, 150);
    }
  };

  // 모바일에서 스와이프 힌트 표시
  useEffect(() => {
    if (isMobile && view && (view === 'month' || view === 'week')) {
      const hasShownHint = localStorage.getItem('swipeHintShown');
      if (!hasShownHint) {
        setShowSwipeHint(true);
        setTimeout(() => {
          setShowSwipeHint(false);
          localStorage.setItem('swipeHintShown', 'true');
        }, 4000);
      }
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
        text = `${format(start, 'yyyy.MM.dd', { locale: ko })} - ${format(end, 'MM.dd', { locale: ko })}`;
        break;
      case 'day':
        start = currentDate;
        end = currentDate;
        text = format(currentDate, 'yyyy.MM.dd (eee)', { locale: ko });
        break;
      case 'month':
      default:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        text = format(currentDate, 'yyyy년 MMMM', { locale: ko });
        break;
    }
    
    return { 
      dateRange: { start, end }, 
      headerText: text 
    };
  }, [currentDate, view]);

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
    loadReservations();
    loadProducts();
  }, [getDateRangeAndHeader]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1200);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
                    {format(day, 'd')}
                  </div>
                  
                  <div className="calendar-mobile-events">
                    {reservationsForDay.slice(0, 3).map((res, resIndex) => (
                      <div 
                        key={res.id} 
                        className={`calendar-mobile-event ${res.status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(res);
                        }}
                      >
                        <span className="event-time">{getReservationTimeRange(res)}</span>
                        <span className="event-customer">{res.customerName}</span>
                        <span className="event-product">
                          {res.productName} - {productsMap.get(res.productId)?.duration ? formatProductDuration(productsMap.get(res.productId)!.duration) : t('reservations.timeNotSet')}
                        </span>
                      </div>
                    ))}
                    
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
    
    if (isMobile) {
      const reservationsForSelectedDay = reservations.filter(r => isSameDay(r.date, selectedDay));

      return (
        <div className="calendar-week-mobile-container">
          <div 
            className="calendar-week-mobile"
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
                      {format(day, 'eee', { locale: ko })}
                    </span>
                    <span className={`calendar-week-mobile-day-number ${isToday ? 'today' : ''}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="reservations-day-view">
              {reservationsForSelectedDay.length === 0 ? (
                <div className="reservations-day-empty">{t('reservations.noReservations')}</div>
              ) : (
                reservationsForSelectedDay.map(reservation => (
                  <div key={reservation.id} className={`reservations-day-item ${reservation.status}`}
                    onClick={() => handleOpenModal(reservation)}
                  >
                    <div>
                      <p className="reservations-day-item-time">{getReservationTimeRange(reservation)}</p>
                      <p className="reservations-day-item-customer">{reservation.customerName}</p>
                      <p className="reservations-day-item-product">{reservation.productName}</p>
                    </div>
                    <div className="reservations-day-item-details">
                      <span className={`reservation-status ${reservation.status}`}>{t(`reservations.status${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}`)}</span>
                      {reservation.memo && <p className="reservations-day-item-memo">{reservation.memo}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    // 데스크탑 뷰 (기존 renderMobileWeekView와 유사하게 유지)
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
                    {format(day, 'eee', { locale: ko })}
                  </span>
                  <span className={`calendar-week-mobile-day-number ${isToday ? 'today' : ''}`}>
                    {format(day, 'd')}
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
                  {reservationsForDay.map((res) => (
                    <div 
                      key={res.id} 
                      className={`calendar-week-mobile-event ${res.status}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(res);
                      }}
                    >
                      <span className="event-time">{getReservationTimeRange(res)}</span>
                      <span className="event-customer">{res.customerName}</span>
                      <span className="event-product">{res.productName}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  const renderDayView = () => (
    <div className="reservations-day-view">
      {reservations.length === 0 ? (
        <div className="reservations-day-empty">{t('reservations.noReservations')}</div>
      ) : (
        reservations.map(reservation => (
          <div key={reservation.id} 
               className={`reservations-day-item ${reservation.status}`}
               onClick={() => handleOpenModal(reservation)}
          >
            <div>
              <p className="reservations-day-item-time">{getReservationTimeRange(reservation)}</p>
              <p className="reservations-day-item-customer">{reservation.customerName}</p>
              <p className="reservations-day-item-product">{reservation.productName}</p>
            </div>
            <div className="reservations-day-item-details">
              <span className={`reservation-status ${reservation.status}`}>{t(`reservations.status${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}`)}</span>
              {reservation.memo && <p className="reservations-day-item-memo">{reservation.memo}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading || view === null) {
    return (
      <div className="content-wrapper">
        <LoadingSpinner fullScreen text={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="content-wrapper">
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

      <div className="card">
        <div className="page-header">
          <div className="reservations-header">
            {!isMobile && (
              <>
                <button
                  onClick={() => changeDate('prev')}
                  className="btn btn-icon"
                >
                  <ChevronLeft style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
                <h2 className="reservations-header-title">{getDateRangeAndHeader.headerText}</h2>
                <button
                  onClick={() => changeDate('next')}
                  className="btn btn-icon"
                >
                  <ChevronRight style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </>
            )}
            {isMobile && (
              <>
                <div className="month-nav-group">
                  <button
                    onClick={() => changeDate('prev')}
                    className="btn btn-icon btn-nav"
                  >
                    <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  <h2 className="reservations-header-title">{getDateRangeAndHeader.headerText}</h2>
                  <button
                    onClick={() => changeDate('next')}
                    className="btn btn-icon btn-nav"
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
            >
              {t('reservations.month')}
            </button>
            <button
              onClick={() => setView('week')}
              className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('reservations.week')}
            </button>
            <button
              onClick={() => setView('day')}
              className={`btn ${view === 'day' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('reservations.day')}
            </button>
          </div>
        </div>

        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

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
    </div>
  );
};

export default ReservationsPage; 