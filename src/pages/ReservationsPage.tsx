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
import type { Reservation } from '../types';
import { reservationService } from '../services/firestore';
import ReservationModal from '../components/ReservationModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrencyFormat } from '../utils/currency';

type ViewType = 'month' | 'week' | 'day';

const ReservationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [initialCustomerIdForModal, setInitialCustomerIdForModal] = useState<string | undefined>(undefined);

  const getDateRangeAndHeader = useMemo(() => {
    let start: Date;
    let end: Date;
    let text: string;
    
    switch (view) {
      case 'week':
        start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
        end = endOfWeek(currentDate, { weekStartsOn: 0 });
        text = `${format(start, 'yyyy MMM d', { locale: ko })} - ${format(end, 'MMM d', { locale: ko })}`;
        break;
      case 'day':
        start = currentDate;
        end = currentDate;
        text = format(currentDate, 'yyyy MMM d (eee)', { locale: ko });
        break;
      case 'month':
      default:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        text = format(currentDate, 'yyyy MMMM', { locale: ko });
        break;
    }
    
    return { 
      dateRange: { start, end }, 
      headerText: text 
    };
  }, [currentDate, view]);

  useEffect(() => {
    loadReservations();
  }, [getDateRangeAndHeader]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getByDateRange(getDateRangeAndHeader.dateRange.start, getDateRangeAndHeader.dateRange.end);
      setReservations(data);
    } catch (error) {
      console.error('예약 목록을 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

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
        console.error('예약 삭제에 실패했습니다:', error);
      }
    }
  };

  const changeDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const modifier = direction === 'prev' ? -1 : 1;
    switch (view) {
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

    return (
      <div className="calendar">
        {dayNames.map(name => (
          <div key={name} className="calendar-header">{name}</div>
        ))}
        {days.map((day, index) => {
          const reservationsForDay = reservations.filter(r => isSameDay(r.date, day));
          return (
            <div
              key={index}
              className={`calendar-day ${!isSameMonth(day, currentDate) ? 'other-month' : ''} ${isSameDay(day, new Date()) ? 'today' : ''}`}
            >
              <div className="day-number">
                {format(day, 'd')}
              </div>
              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {reservationsForDay.map(res => (
                  <div 
                    key={res.id} 
                    className={`reservation-item ${res.status === 'cancelled' ? 'cancelled' : ''} ${res.status === 'completed' ? 'completed' : ''}`} 
                    onClick={() => handleOpenModal(res)}
                  >
                    <p className="time">{res.time} {res.customerName}</p>
                    <p className="product-price">{res.productName} - {formatCurrency(res.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 0 }) });
    
    return (
      <div className="calendar">
        {days.map((day, index) => {
          const reservationsForDay = reservations.filter(r => isSameDay(r.date, day));
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={index} className={`week-day-container ${isToday ? 'today' : ''}`}>
              <div className="calendar-header">
                {format(day, 'eee, d', { locale: ko })}
              </div>
              <div className="calendar-day" style={{ minHeight: '200px' }}>
                {reservationsForDay.map(res => (
                  <div 
                    key={res.id} 
                    className={`reservation-item ${res.status === 'cancelled' ? 'cancelled' : ''} ${res.status === 'completed' ? 'completed' : ''}`} 
                    onClick={() => handleOpenModal(res)}
                  >
                    <p className="time">{res.time}</p>
                    <p>{res.customerName}</p>
                    <p style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{res.productName}</p>
                    <p className="price">{formatCurrency(res.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderDayView = () => (
    <div className="reservations-day-view">
      {reservations.length === 0 ? (
        <div className="reservations-day-empty">{t('reservations.noReservations')}</div>
      ) : (
        reservations.map(reservation => (
          <div key={reservation.id} className={`reservations-day-item ${reservation.status === 'completed' ? 'completed' : ''}`}>
            <div>
              <p className="reservations-day-item-time">{reservation.time}</p>
              <p className="reservations-day-item-customer">{reservation.customerName}</p>
              <p className="reservations-day-item-product">{reservation.productName}</p>
            </div>
            <div className="reservations-day-item-btn-group">
              <span className="reservations-day-item-price">{formatCurrency(reservation.price)}</span>
              <button
                onClick={() => handleOpenModal(reservation)}
                className="btn btn-icon edit"
              >
                <Edit style={{ width: '1rem', height: '1rem' }} />
              </button>
              <button
                onClick={() => handleDelete(reservation.id)}
                className="btn btn-icon delete"
              >
                <Trash2 style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
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
            <button
              onClick={() => changeDate('today')}
              className="btn btn-secondary"
            >
              {t('reservations.today')}
            </button>
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