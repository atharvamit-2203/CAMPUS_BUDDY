'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  CalendarDays,
  Clock, 
  MapPin, 
  Users, 
  Plus,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight,
  Filter,
  Palette,
  Link,
  Bell,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

// Club Calendar Component
const ClubCalendar = ({ clubId = null, showAllClubs = false }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedClubs, setSelectedClubs] = useState([]);
  const [calendarSettings, setCalendarSettings] = useState({
    calendar_public: true,
    calendar_color: '#3B82F6',
    calendar_description: ''
  });

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    event_type: 'other',
    max_participants: '',
    registration_required: false,
    is_public: true,
    calendar_color: '#3B82F6',
    is_recurring: false,
    recurrence_type: '',
    recurrence_end_date: '',
    recurrence_days: ''
  });

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, clubId, showAllClubs]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      let url;
      if (showAllClubs) {
        url = `/api/calendar/${year}/${month}`;
        if (selectedClubs.length > 0) {
          url += `?club_ids=${selectedClubs.join(',')}`;
        }
      } else if (clubId) {
        url = `/api/clubs/${clubId}/calendar/${year}/${month}`;
      } else {
        // Get upcoming events for user
        url = `/api/calendar/upcoming?days_ahead=30&limit=100`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      setCalendarData(data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
    setLoading(false);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(newEvent)
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Event created successfully!');
        setShowCreateModal(false);
        setNewEvent({
          title: '',
          description: '',
          event_date: '',
          start_time: '',
          end_time: '',
          venue: '',
          event_type: 'other',
          max_participants: '',
          registration_required: false,
          is_public: true,
          calendar_color: '#3B82F6',
          is_recurring: false,
          recurrence_type: '',
          recurrence_end_date: '',
          recurrence_days: ''
        });
        fetchCalendarData();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      alert('Error creating event');
      console.error('Error:', error);
    }
  };

  const handleRegisterForEvent = async (eventId) => {
    try {
      const response = await fetch(`/api/clubs/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        alert('Successfully registered for event!');
        fetchCalendarData();
        setShowEventModal(false);
      } else {
        const data = await response.json();
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      alert('Error registering for event');
      console.error('Error:', error);
    }
  };

  const updateCalendarSettings = async () => {
    try {
      const response = await fetch(`/api/clubs/${clubId}/calendar/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(calendarSettings)
      });

      if (response.ok) {
        alert('Calendar settings updated successfully!');
        setShowSettingsModal(false);
        fetchCalendarData();
      } else {
        const data = await response.json();
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      alert('Error updating settings');
      console.error('Error:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!calendarData || !date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    
    if (showAllClubs && calendarData.all_events) {
      return calendarData.all_events.filter(event => event.date === dateStr);
    } else if (calendarData.events) {
      return calendarData.events.filter(event => event.date === dateStr);
    }
    
    return [];
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const eventTypeColors = {
    meeting: 'bg-blue-500',
    workshop: 'bg-green-500',
    competition: 'bg-red-500',
    seminar: 'bg-purple-500',
    social: 'bg-yellow-500',
    recruitment: 'bg-orange-500',
    other: 'bg-gray-500'
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-blue-400" />
            {showAllClubs ? 'All Clubs Calendar' : (calendarData?.club?.name || 'Club Calendar')}
          </h2>
          {calendarData?.club?.description && (
            <p className="text-gray-400 mt-1">{calendarData.club.description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {clubId && (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </button>
              
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center px-4 py-2 bg-gray-700/50 text-gray-400 rounded-lg hover:bg-gray-600/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="flex items-center px-4 py-2 bg-gray-700/50 text-gray-400 rounded-lg hover:bg-gray-600/50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <h3 className="text-xl font-semibold text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <button
          onClick={() => navigateMonth(1)}
          className="flex items-center px-4 py-2 bg-gray-700/50 text-gray-400 rounded-lg hover:bg-gray-600/50 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-gray-400 font-semibold py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const events = day ? getEventsForDate(day) : [];
          const isToday = day && day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-24 p-2 rounded-lg border ${
                day
                  ? isToday
                    ? 'bg-blue-500/20 border-blue-500/30'
                    : 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-600/30'
                  : 'border-transparent'
              } transition-colors`}
            >
              {day && (
                <>
                  <div className={`text-sm font-semibold mb-1 ${
                    isToday ? 'text-blue-400' : 'text-white'
                  }`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {events.slice(0, 2).map((event, eventIndex) => (
                      <button
                        key={eventIndex}
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventModal(true);
                        }}
                        className={`w-full text-left p-1 rounded text-xs text-white truncate transition-opacity hover:opacity-80`}
                        style={{ backgroundColor: event.color || '#3B82F6' }}
                      >
                        {event.title}
                      </button>
                    ))}
                    
                    {events.length > 2 && (
                      <div className="text-xs text-gray-400">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Events List */}
      {showAllClubs && calendarData?.clubs && Object.keys(calendarData.clubs).length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Clubs This Month</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(calendarData.clubs).map(([clubId, clubData]) => (
              <div key={clubId} className="bg-gray-700/30 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: clubData.club_color }}
                  />
                  <h4 className="font-semibold text-white">{clubData.club_name}</h4>
                </div>
                <div className="text-sm text-gray-400">
                  {clubData.events.length} events this month
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <CalendarDays className="w-5 h-5 mr-3 text-blue-400" />
                {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              
              <div className="flex items-center text-gray-300">
                <Clock className="w-5 h-5 mr-3 text-green-400" />
                {formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}
              </div>
              
              {selectedEvent.venue && (
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-5 h-5 mr-3 text-red-400" />
                  {selectedEvent.venue}
                </div>
              )}
              
              {selectedEvent.club_name && (
                <div className="flex items-center text-gray-300">
                  <Users className="w-5 h-5 mr-3 text-purple-400" />
                  {selectedEvent.club_name}
                </div>
              )}
              
              {selectedEvent.description && (
                <div className="mt-4">
                  <h4 className="font-semibold text-white mb-2">Description</h4>
                  <p className="text-gray-300">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.registration_required && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-blue-400 font-semibold">Registration Required</div>
                      <div className="text-sm text-gray-400">
                        {selectedEvent.registration_count || 0} registered
                        {selectedEvent.max_participants && ` / ${selectedEvent.max_participants} max`}
                      </div>
                    </div>
                    
                    {!selectedEvent.user_registered && (
                      <button
                        onClick={() => handleRegisterForEvent(selectedEvent.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Register
                      </button>
                    )}
                    
                    {selectedEvent.user_registered && (
                      <div className="flex items-center text-green-400">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Registered
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-90vh overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create New Event</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
                <select
                  value={newEvent.event_type}
                  onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="meeting">Meeting</option>
                  <option value="workshop">Workshop</option>
                  <option value="competition">Competition</option>
                  <option value="seminar">Seminar</option>
                  <option value="social">Social</option>
                  <option value="recruitment">Recruitment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                <input
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time *</label>
                <input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Time *</label>
                <input
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent({...newEvent, end_time: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
                <input
                  type="text"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({...newEvent, venue: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Participants</label>
                <input
                  type="number"
                  value={newEvent.max_participants}
                  onChange={(e) => setNewEvent({...newEvent, max_participants: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Calendar Color</label>
                <input
                  type="color"
                  value={newEvent.calendar_color}
                  onChange={(e) => setNewEvent({...newEvent, calendar_color: e.target.value})}
                  className="w-full h-10 bg-gray-700/50 border border-gray-600 rounded-lg cursor-pointer"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>
              
              <div className="md:col-span-2 flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newEvent.registration_required}
                    onChange={(e) => setNewEvent({...newEvent, registration_required: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Registration Required</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newEvent.is_public}
                    onChange={(e) => setNewEvent({...newEvent, is_public: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Public Event</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newEvent.is_recurring}
                    onChange={(e) => setNewEvent({...newEvent, is_recurring: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Recurring Event</span>
                </label>
              </div>
              
              {newEvent.is_recurring && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Recurrence Type</label>
                    <select
                      value={newEvent.recurrence_type}
                      onChange={(e) => setNewEvent({...newEvent, recurrence_type: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select recurrence</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Recurrence End Date</label>
                    <input
                      type="date"
                      value={newEvent.recurrence_end_date}
                      onChange={(e) => setNewEvent({...newEvent, recurrence_end_date: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Calendar Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={calendarSettings.calendar_public}
                    onChange={(e) => setCalendarSettings({...calendarSettings, calendar_public: e.target.checked})}
                    className="mr-3"
                  />
                  <span className="text-gray-300">Make calendar public</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Calendar Color</label>
                <input
                  type="color"
                  value={calendarSettings.calendar_color}
                  onChange={(e) => setCalendarSettings({...calendarSettings, calendar_color: e.target.value})}
                  className="w-full h-10 bg-gray-700/50 border border-gray-600 rounded-lg cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Calendar Description</label>
                <textarea
                  value={calendarSettings.calendar_description}
                  onChange={(e) => setCalendarSettings({...calendarSettings, calendar_description: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>
              
              <button
                onClick={updateCalendarSettings}
                className="w-full flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Update Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubCalendar;