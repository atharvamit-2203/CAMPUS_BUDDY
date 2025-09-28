'use client';

import { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiUsers, 
  FiPlus, 
  FiEdit, 
  FiTrash,
  FiEye,
  FiShare,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiDownload,
  FiBell,
  FiMail
} from 'react-icons/fi';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  maxAttendees: number;
  registeredAttendees: number;
  category: 'workshop' | 'seminar' | 'conference' | 'meeting' | 'training' | 'webinar';
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  isPublic: boolean;
  organizer: string;
  contactEmail: string;
  requirements: string[];
  registrationDeadline: string;
  createdAt: string;
}

interface EventRegistration {
  id: number;
  eventId: number;
  participantName: string;
  participantEmail: string;
  participantType: 'student' | 'faculty' | 'external';
  registrationDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export default function FacultyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Simulate API calls
    const fetchData = async () => {
      try {
        const mockEvents: Event[] = [
          {
            id: 1,
            title: 'Machine Learning Workshop',
            description: 'Hands-on workshop covering fundamentals of machine learning and practical implementation',
            date: '2025-09-20',
            startTime: '10:00',
            endTime: '16:00',
            venue: 'Auditorium A',
            maxAttendees: 100,
            registeredAttendees: 85,
            category: 'workshop',
            status: 'published',
            isPublic: true,
            organizer: 'Dr. Sarah Johnson',
            contactEmail: 'sarah.johnson@university.edu',
            requirements: ['Laptop', 'Python knowledge', 'Mathematics background'],
            registrationDeadline: '2025-09-18',
            createdAt: '2025-09-10'
          },
          {
            id: 2,
            title: 'Department Faculty Meeting',
            description: 'Monthly faculty meeting to discuss curriculum updates and student progress',
            date: '2025-09-15',
            startTime: '14:00',
            endTime: '16:00',
            venue: 'Conference Room B',
            maxAttendees: 25,
            registeredAttendees: 18,
            category: 'meeting',
            status: 'completed',
            isPublic: false,
            organizer: 'Prof. Michael Davis',
            contactEmail: 'michael.davis@university.edu',
            requirements: ['Meeting agenda', 'Progress reports'],
            registrationDeadline: '2025-09-14',
            createdAt: '2025-09-05'
          },
          {
            id: 3,
            title: 'Research Seminar: AI in Education',
            description: 'Seminar on the latest developments in artificial intelligence applications in education',
            date: '2025-09-25',
            startTime: '11:00',
            endTime: '12:30',
            venue: 'Room 301',
            maxAttendees: 60,
            registeredAttendees: 45,
            category: 'seminar',
            status: 'published',
            isPublic: true,
            organizer: 'Dr. Emily Chen',
            contactEmail: 'emily.chen@university.edu',
            requirements: ['Research background', 'Interest in AI'],
            registrationDeadline: '2025-09-23',
            createdAt: '2025-09-08'
          }
        ];

        const mockRegistrations: EventRegistration[] = [
          {
            id: 1,
            eventId: 1,
            participantName: 'Rahul Sharma',
            participantEmail: 'rahul.sharma@student.edu',
            participantType: 'student',
            registrationDate: '2025-09-12',
            status: 'confirmed'
          },
          {
            id: 2,
            eventId: 1,
            participantName: 'Dr. Amanda Wilson',
            participantEmail: 'amanda.wilson@university.edu',
            participantType: 'faculty',
            registrationDate: '2025-09-11',
            status: 'confirmed'
          }
        ];

        setEvents(mockEvents);
        setRegistrations(mockRegistrations);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'seminar': return 'bg-green-100 text-green-800';
      case 'conference': return 'bg-purple-100 text-purple-800';
      case 'meeting': return 'bg-yellow-100 text-yellow-800';
      case 'training': return 'bg-orange-100 text-orange-800';
      case 'webinar': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FiEdit className="text-gray-500" />;
      case 'published': return <FiCheckCircle className="text-green-500" />;
      case 'ongoing': return <FiClock className="text-blue-500" />;
      case 'completed': return <FiCheckCircle className="text-purple-500" />;
      case 'cancelled': return <FiAlertCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
            <p className="text-gray-600">Create and manage academic events, workshops, and seminars</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FiPlus className="mr-2" />
            Create Event
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiCalendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            <p className="text-sm text-gray-600">Total Events</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {events.filter(event => event.status === 'published').length}
            </p>
            <p className="text-sm text-gray-600">Published Events</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiUsers className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {events.reduce((sum, event) => sum + event.registeredAttendees, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Registrations</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiClock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {events.filter(event => event.status === 'ongoing').length}
            </p>
            <p className="text-sm text-gray-600">Ongoing Events</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="workshop">Workshops</option>
              <option value="seminar">Seminars</option>
              <option value="conference">Conferences</option>
              <option value="meeting">Meetings</option>
              <option value="training">Training</option>
              <option value="webinar">Webinars</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center">
              <FiDownload className="mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Event Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-3">{event.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiCalendar className="mr-1" />
                        {event.date}
                      </div>
                      <div className="flex items-center">
                        <FiClock className="mr-1" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center">
                        <FiMapPin className="mr-1" />
                        {event.venue}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                      <span className="ml-1">{event.status}</span>
                    </span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Registrations</p>
                    <p className="text-xl font-bold text-blue-900">
                      {event.registeredAttendees}/{event.maxAttendees}
                    </p>
                    <div className="mt-1 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(event.registeredAttendees / event.maxAttendees) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Organizer</p>
                    <p className="text-sm font-bold text-green-900">{event.organizer}</p>
                    <p className="text-xs text-green-600">{event.contactEmail}</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Registration Deadline</p>
                    <p className="text-sm font-bold text-yellow-900">{event.registrationDeadline}</p>
                    <p className="text-xs text-yellow-600">
                      {event.isPublic ? 'Public Event' : 'Private Event'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Requirements</p>
                    <p className="text-xs text-purple-900">{event.requirements.length} items</p>
                    <p className="text-xs text-purple-600">Click to view details</p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements:</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.requirements.map((req, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-2">
                    <button 
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center text-sm"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <FiEye className="mr-1" />
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center text-sm">
                      <FiEdit className="mr-1" />
                      Edit
                    </button>
                    <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center text-sm">
                      <FiUsers className="mr-1" />
                      Manage Registrations
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Send Notifications">
                      <FiBell className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Email Participants">
                      <FiMail className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Share Event">
                      <FiShare className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-red-500" title="Delete Event">
                      <FiTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Event</h3>
              <EventForm 
                onSave={(event) => {
                  setEvents([{ ...event, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] }, ...events]);
                  setShowCreateModal(false);
                }}
                onCancel={() => setShowCreateModal(false)} 
              />
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <EventDetails 
                event={selectedEvent} 
                registrations={registrations.filter(reg => reg.eventId === selectedEvent.id)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Event Form Component
interface EventFormProps {
  onSave: (event: Omit<Event, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function EventForm({ onSave, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    maxAttendees: 50,
    registeredAttendees: 0,
    category: 'workshop' as const,
    status: 'draft' as const,
    isPublic: true,
    organizer: 'Dr. Faculty Name',
    contactEmail: 'faculty@university.edu',
    requirements: [] as string[],
    registrationDeadline: ''
  });

  const [newRequirement, setNewRequirement] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
          <input
            type="date"
            value={formData.registrationDeadline}
            onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
          <input
            type="text"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label>
          <input
            type="number"
            value={formData.maxAttendees}
            onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as Event['category'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
            <option value="conference">Conference</option>
            <option value="meeting">Meeting</option>
            <option value="training">Training</option>
            <option value="webinar">Webinar</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add requirement"
          />
          <button
            type="button"
            onClick={addRequirement}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.requirements.map((req, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded flex items-center">
              {req}
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm text-gray-700">Make this event public</label>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
        >
          Create Event
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Event Details Component
interface EventDetailsProps {
  event: Event;
  registrations: EventRegistration[];
}

function EventDetails({ event, registrations }: EventDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Event Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Date:</span> {event.date}
          </div>
          <div>
            <span className="font-medium">Time:</span> {event.startTime} - {event.endTime}
          </div>
          <div>
            <span className="font-medium">Venue:</span> {event.venue}
          </div>
          <div>
            <span className="font-medium">Organizer:</span> {event.organizer}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Registrations ({registrations.length})</h4>
        <div className="space-y-2">
          {registrations.map((registration) => (
            <div key={registration.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{registration.participantName}</span>
                <span className="text-sm text-gray-600 ml-2">({registration.participantType})</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                registration.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {registration.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
