'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  MapPin,
  Clock,
  Users,
  X,
  ExternalLink
} from 'lucide-react';

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  formLink: string;
  footfall?: string;
  guest?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  event_type?: string;
  calendar_color?: string;
}

interface OrganizationEventCalendarProps {
  clubId?: number;
  onEventCreated?: () => void;
}

const OrganizationEventCalendar: React.FC<OrganizationEventCalendarProps> = ({ 
  clubId = 1,
  onEventCreated 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const fetchCalendarEvents = React.useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const response = await fetch(
        `http://localhost:8000/clubs/${clubId}/calendar/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
    setLoading(false);
  }, [currentDate, clubId]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  // Listen for event creation from other components
  useEffect(() => {
    const handleEventCreated = () => {
      fetchCalendarEvents();
    };
    
    window.addEventListener('eventCreated', handleEventCreated);
    return () => {
      window.removeEventListener('eventCreated', handleEventCreated);
    };
  }, [fetchCalendarEvents]);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => {
      const eventDate = event.event_date || event.date;
      return eventDate?.startsWith(dateStr);
    });
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Render calendar
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[100px] bg-gray-50 border border-gray-200"></div>
      );
    }
    
    // Days of the month
    const today = new Date();
    const isCurrentMonth = 
      currentDate.getMonth() === today.getMonth() && 
      currentDate.getFullYear() === today.getFullYear();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day);
      const isToday = isCurrentMonth && day === today.getDate();
      
      days.push(
        <div 
          key={day} 
          className={`min-h-[100px] border border-gray-200 p-2 transition-all ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${
            isToday ? 'text-blue-600' : 'text-gray-700'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <button
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventModal(true);
                }}
                className="w-full text-left text-xs p-1.5 rounded truncate transition-all hover:shadow-md bg-blue-500 text-white"
                title={event.title}
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="truncate">{event.title}</span>
                </div>
              </button>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 pl-1">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="bg-gray-100 border-b border-gray-200 p-3 text-center font-semibold text-gray-700">
            {day}
          </div>
        ))}
        {/* Calendar days */}
        {days}
      </div>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Events Calendar</h2>
            <p className="text-sm text-gray-500">View and manage your organization&apos;s events</p>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          {renderCalendar()}

          {/* Event Count */}
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-semibold">{events.length}</span> event{events.length !== 1 ? 's' : ''} this month
          </div>
        </>
      )}

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 bg-blue-500 text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedEvent.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/90">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedEvent.event_date || selectedEvent.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedEvent.start_time || selectedEvent.time}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-white/90 hover:text-white transition-colors"
                  title="Close"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">Description</h4>
                <p className="text-gray-700">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Venue</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{selectedEvent.venue}</span>
                  </div>
                </div>

                {selectedEvent.footfall && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">Expected Footfall</h4>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{selectedEvent.footfall}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.guest && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Guest Speaker</h4>
                  <p className="text-gray-700">{selectedEvent.guest}</p>
                </div>
              )}

              {selectedEvent.formLink && (
                <a
                  href={selectedEvent.formLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Register for Event</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationEventCalendar;
