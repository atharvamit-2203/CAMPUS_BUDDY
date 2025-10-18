"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  Edit2, 
  X,
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react';

// Type definitions
interface TimetableEntry {
  id?: number;
  activity_name: string;
  description: string;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time: string;
  end_time: string;
  venue: string;
  activity_type: 'meeting' | 'practice' | 'workshop' | 'training' | 'other';
  is_active?: boolean;
  effective_from?: string;
  effective_until?: string;
}

interface UpcomingEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  event_type: string;
  status: string;
  club_name: string;
  registration_required: boolean;
  max_participants?: number;
  registration_count?: number;
}

interface ClubTimetableProps {
  clubId: number;
  clubName: string;
  isAdmin?: boolean;
}

const ClubTimetable: React.FC<ClubTimetableProps> = ({ clubId, clubName, isAdmin = false }) => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'timetable' | 'events'>('timetable');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  const [formData, setFormData] = useState<TimetableEntry>({
    activity_name: '',
    description: '',
    day_of_week: 'monday',
    start_time: '',
    end_time: '',
    venue: '',
    activity_type: 'meeting',
    effective_from: '',
    effective_until: ''
  });

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const activityTypes = ['meeting', 'practice', 'workshop', 'training', 'other'];

  // Fetch timetable
  const fetchTimetable = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/${clubId}/timeline`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimetable(data);
      }
    } catch (err) {
      console.error('Error fetching timetable:', err);
    }
  };

  // Fetch upcoming events
  const fetchUpcomingEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/${clubId}/events?status=approved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only upcoming events
        const now = new Date();
        const upcoming = data.filter((event: UpcomingEvent) => {
          const eventDate = new Date(event.event_date);
          return eventDate >= now;
        }).sort((a: UpcomingEvent, b: UpcomingEvent) => 
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        );
        setUpcomingEvents(upcoming);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    fetchTimetable();
    fetchUpcomingEvents();
  }, [clubId]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Create timetable entry
  const handleCreateEntry = async () => {
    setError('');
    setSuccessMessage('');

    if (!formData.activity_name || !formData.start_time || !formData.end_time || !formData.venue) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/${clubId}/timeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccessMessage('Timetable entry created successfully!');
        setShowAddModal(false);
        resetForm();
        fetchTimetable();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create entry');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update timetable entry
  const handleUpdateEntry = async () => {
    if (!editingEntry || !editingEntry.id) return;

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/${clubId}/timeline/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccessMessage('Timetable entry updated successfully!');
        setShowEditModal(false);
        setEditingEntry(null);
        resetForm();
        fetchTimetable();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update entry');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Delete timetable entry
  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/${clubId}/timeline/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccessMessage('Entry deleted successfully!');
        fetchTimetable();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  // Convert timetable to recurring events
  const handleSyncWithEvents = async () => {
    if (!confirm('This will create events from your timetable for the next 4 weeks. Continue?')) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/${clubId}/timeline/sync-events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ weeks: 4 })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(`Successfully created ${result.events_created} events from timetable!`);
        fetchUpcomingEvents();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to sync with events');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Register for event
  const handleRegisterForEvent = async (eventId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clubs/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccessMessage('Successfully registered for event!');
        fetchUpcomingEvents();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to register');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      activity_name: '',
      description: '',
      day_of_week: 'monday',
      start_time: '',
      end_time: '',
      venue: '',
      activity_type: 'meeting',
      effective_from: '',
      effective_until: ''
    });
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setShowEditModal(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {clubName} - Schedule Management
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <Plus size={20} />
            Add to Timetable
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle size={20} />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'timetable'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          Weekly Timetable
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'events'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          Upcoming Events ({upcomingEvents.length})
        </button>
      </div>

      {/* Timetable Tab */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          {isAdmin && timetable.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleSyncWithEvents}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                <Calendar size={20} />
                {loading ? 'Syncing...' : 'Sync with Events (4 weeks)'}
              </button>
            </div>
          )}

          {timetable.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No timetable entries yet</p>
              {isAdmin && (
                <p className="text-sm mt-2">Click "Add to Timetable" to create recurring activities</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {daysOfWeek.map(day => {
                const dayEntries = timetable.filter(entry => entry.day_of_week === day);
                if (dayEntries.length === 0) return null;

                return (
                  <div key={day} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white capitalize mb-3">
                      {day}
                    </h3>
                    <div className="space-y-2">
                      {dayEntries.map(entry => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-800 dark:text-white">
                                {entry.activity_name}
                              </h4>
                              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                {entry.activity_type}
                              </span>
                            </div>
                            {entry.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                {entry.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock size={16} />
                                {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin size={16} />
                                {entry.venue}
                              </div>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(entry)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded transition"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => entry.id && handleDeleteEntry(entry.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No upcoming events</p>
              <p className="text-sm mt-2">Events created from timetable will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                      {event.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.status === 'approved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {formatDate(event.event_date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      {event.venue}
                    </div>
                  </div>

                  {event.registration_required && (
                    <div className="mt-3 pt-3 border-t dark:border-gray-700">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {event.max_participants && (
                          <span>
                            {event.registration_count || 0} / {event.max_participants} registered
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRegisterForEvent(event.id)}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                      >
                        Register Now
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {showEditModal ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingEntry(null);
                  resetForm();
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Activity Name *
                </label>
                <input
                  type="text"
                  name="activity_name"
                  value={formData.activity_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Weekly Meeting, Dance Practice"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Brief description of the activity"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Day of Week *
                  </label>
                  <select
                    name="day_of_week"
                    value={formData.day_of_week}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day} className="capitalize">
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Activity Type *
                  </label>
                  <select
                    name="activity_type"
                    value={formData.activity_type}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {activityTypes.map(type => (
                      <option key={type} value={type} className="capitalize">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    End Time *
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Seminar Hall, Auditorium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Effective From
                  </label>
                  <input
                    type="date"
                    name="effective_from"
                    value={formData.effective_from}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Effective Until
                  </label>
                  <input
                    type="date"
                    name="effective_until"
                    value={formData.effective_until}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={showEditModal ? handleUpdateEntry : handleCreateEntry}
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : (showEditModal ? 'Update' : 'Create')}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingEntry(null);
                    resetForm();
                    setError('');
                  }}
                  className="px-6 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubTimetable;
