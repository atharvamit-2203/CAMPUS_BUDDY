'use client';

import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../../services/roleBasedAPI';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  BookOpen,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';

// Type definitions
interface ClassSchedule {
  id: string;
  subject: string;
  instructor: string;
  room: string;
  time: string;
  duration: string;
  day: string;
  type: 'lecture' | 'lab' | 'tutorial';
  color: string;
}

interface PersonalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'study' | 'assignment' | 'exam' | 'personal' | 'reminder';
  priority: 'low' | 'medium' | 'high';
}

interface ExamSchedule {
  id: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  type: 'midterm' | 'final' | 'quiz' | 'assignment';
}

const TimetablePage = () => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'personal' | 'exams'>('timetable');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sample data - would come from API in production
  const [classSchedule] = useState<ClassSchedule[]>([
    {
      id: '1',
      subject: 'Data Structures & Algorithms',
      instructor: 'Dr. Sharma',
      room: 'CS-101',
      time: '09:00 AM',
      duration: '1h 30m',
      day: 'Monday',
      type: 'lecture',
      color: 'bg-blue-500'
    },
    {
      id: '2',
      subject: 'Database Management Systems',
      instructor: 'Prof. Patel',
      room: 'CS-102',
      time: '11:00 AM',
      duration: '1h 30m',
      day: 'Monday',
      type: 'lecture',
      color: 'bg-green-500'
    },
    {
      id: '3',
      subject: 'Web Development Lab',
      instructor: 'Dr. Kumar',
      room: 'Lab-A',
      time: '02:00 PM',
      duration: '3h',
      day: 'Monday',
      type: 'lab',
      color: 'bg-purple-500'
    },
    {
      id: '4',
      subject: 'Machine Learning',
      instructor: 'Dr. Singh',
      room: 'CS-103',
      time: '09:00 AM',
      duration: '1h 30m',
      day: 'Tuesday',
      type: 'lecture',
      color: 'bg-orange-500'
    },
    {
      id: '5',
      subject: 'Software Engineering',
      instructor: 'Prof. Gupta',
      room: 'CS-104',
      time: '11:00 AM',
      duration: '1h 30m',
      day: 'Tuesday',
      type: 'lecture',
      color: 'bg-red-500'
    },
    {
      id: '6',
      subject: 'Data Structures Lab',
      instructor: 'Dr. Sharma',
      room: 'Lab-B',
      time: '02:00 PM',
      duration: '3h',
      day: 'Tuesday',
      type: 'lab',
      color: 'bg-blue-500'
    },
    {
      id: '7',
      subject: 'Computer Networks',
      instructor: 'Dr. Rao',
      room: 'CS-105',
      time: '09:00 AM',
      duration: '1h 30m',
      day: 'Wednesday',
      type: 'lecture',
      color: 'bg-teal-500'
    },
    {
      id: '8',
      subject: 'Operating Systems',
      instructor: 'Prof. Verma',
      room: 'CS-106',
      time: '11:00 AM',
      duration: '1h 30m',
      day: 'Wednesday',
      type: 'lecture',
      color: 'bg-indigo-500'
    },
    {
      id: '9',
      subject: 'Database Lab',
      instructor: 'Prof. Patel',
      room: 'Lab-C',
      time: '02:00 PM',
      duration: '3h',
      day: 'Wednesday',
      type: 'lab',
      color: 'bg-green-500'
    },
    {
      id: '10',
      subject: 'Computer Architecture',
      instructor: 'Dr. Joshi',
      room: 'CS-107',
      time: '09:00 AM',
      duration: '1h 30m',
      day: 'Thursday',
      type: 'lecture',
      color: 'bg-pink-500'
    },
    {
      id: '11',
      subject: 'Artificial Intelligence',
      instructor: 'Dr. Singh',
      room: 'CS-108',
      time: '11:00 AM',
      duration: '1h 30m',
      day: 'Thursday',
      type: 'lecture',
      color: 'bg-yellow-500'
    },
    {
      id: '12',
      subject: 'Project Work',
      instructor: 'Various Faculty',
      room: 'Project Lab',
      time: '02:00 PM',
      duration: '3h',
      day: 'Thursday',
      type: 'lab',
      color: 'bg-gray-500'
    },
    {
      id: '13',
      subject: 'Seminar Presentation',
      instructor: 'Dr. Mehta',
      room: 'Seminar Hall',
      time: '09:00 AM',
      duration: '2h',
      day: 'Friday',
      type: 'tutorial',
      color: 'bg-cyan-500'
    },
    {
      id: '14',
      subject: 'Research Methodology',
      instructor: 'Prof. Nair',
      room: 'CS-109',
      time: '11:00 AM',
      duration: '1h 30m',
      day: 'Friday',
      type: 'lecture',
      color: 'bg-lime-500'
    }
  ]);

  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([
    {
      id: '1',
      title: 'Study Group - DSA',
      description: 'Group study session for upcoming DSA exam',
      date: '2025-09-15',
      time: '07:00 PM',
      type: 'study',
      priority: 'medium'
    },
    {
      id: '2',
      title: 'Assignment Submission',
      description: 'DBMS assignment due',
      date: '2025-09-16',
      time: '11:59 PM',
      type: 'assignment',
      priority: 'high'
    },
    {
      id: '3',
      title: 'Gym Session',
      description: 'Evening workout',
      date: '2025-09-17',
      time: '06:00 PM',
      type: 'personal',
      priority: 'low'
    }
  ]);

  const [examSchedule] = useState<ExamSchedule[]>([
    {
      id: '1',
      subject: 'Data Structures & Algorithms',
      date: '2025-09-25',
      time: '09:00 AM',
      duration: '3h',
      room: 'Main Hall A',
      type: 'midterm'
    },
    {
      id: '2',
      subject: 'Database Management Systems',
      date: '2025-09-26',
      time: '09:00 AM',
      duration: '3h',
      room: 'Main Hall B',
      type: 'midterm'
    },
    {
      id: '3',
      subject: 'Machine Learning',
      date: '2025-09-27',
      time: '02:00 PM',
      duration: '3h',
      room: 'Main Hall A',
      type: 'midterm'
    },
    {
      id: '4',
      subject: 'Software Engineering',
      date: '2025-09-28',
      time: '09:00 AM',
      duration: '3h',
      room: 'Main Hall C',
      type: 'midterm'
    }
  ]);

  const [newEvent, setNewEvent] = useState<Partial<PersonalEvent>>({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'personal',
    priority: 'medium'
  });

  // Fetch timetable data from API
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const data = await studentAPI.getTimetable();
        setTimetableData(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load timetable');
        console.error('Error fetching timetable:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  const addPersonalEvent = () => {
    if (newEvent.title && newEvent.date && newEvent.time) {
      const event: PersonalEvent = {
        id: Date.now().toString(),
        title: newEvent.title!,
        description: newEvent.description || '',
        date: newEvent.date!,
        time: newEvent.time!,
        type: newEvent.type as PersonalEvent['type'] || 'personal',
        priority: newEvent.priority as PersonalEvent['priority'] || 'medium'
      };
      setPersonalEvents([...personalEvents, event]);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'personal',
        priority: 'medium'
      });
      setShowAddEvent(false);
    }
  };

  const deletePersonalEvent = (id: string) => {
    setPersonalEvents(personalEvents.filter(event => event.id !== id));
  };

  const getClassesForDay = (day: string) => {
    return classSchedule.filter(cls => cls.day === day);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture': return '📚';
      case 'lab': return '🔬';
      case 'tutorial': return '👥';
      case 'study': return '📖';
      case 'assignment': return '📝';
      case 'exam': return '📋';
      case 'personal': return '👤';
      case 'reminder': return '⏰';
      default: return '📅';
    }
  };

  // Header component
  const Header = () => (
    <div className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
            <p className="text-gray-600 mt-1">Manage your academic schedule and personal events</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddEvent(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Event</span>
            </button>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-md text-sm ${viewMode === 'week' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-md text-sm ${viewMode === 'day' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                Day
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Tab navigation
  const TabNavigation = () => (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {[
            { id: 'timetable', label: 'Class Schedule', icon: Calendar },
            { id: 'personal', label: 'Personal Events', icon: User },
            { id: 'exams', label: 'Exam Schedule', icon: AlertCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'timetable' | 'personal' | 'exams')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Timetable view
  const TimetableView = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading timetable...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Convert API data to component format
    const convertApiToClasses = (apiData: any): ClassSchedule[] => {
      if (!apiData || !Array.isArray(apiData)) return [];

      return apiData.map((entry: any, index: number) => ({
        id: String(entry.id || index),
        subject: entry.subject || 'Unknown Subject',
        instructor: entry.faculty_name || entry.instructor || 'TBA',
        room: entry.room || 'TBA',
        time: entry.start_time || 'TBA',
        duration: entry.duration || '1h',
        day: entry.day || 'Monday',
        type: 'lecture' as const,
        color: getColorForSubject(entry.subject || 'Unknown')
      }));
    };

    const getColorForSubject = (subject: string): string => {
      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'];
      const index = subject.length % colors.length;
      return colors[index];
    };

    const classesFromApi = convertApiToClasses(timetableData);
    const getClassesForDayFromApi = (day: string) => {
      return classesFromApi.filter(cls => cls.day === day);
    };

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-0 border-b">
              <div className="p-4 bg-gray-50 font-semibold text-gray-700">Time</div>
              {days.slice(0, 7).map(day => (
                <div key={day} className="p-4 bg-gray-50 font-semibold text-gray-700 text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Time slots */}
            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-8 gap-0 border-b border-gray-100">
                <div className="p-3 bg-gray-50 text-sm font-medium text-gray-600">
                  {time}
                </div>
                {days.slice(0, 7).map(day => {
                  const dayClasses = getClassesForDayFromApi(day).filter(cls => cls.time === time);
                  return (
                    <div key={`${day}-${time}`} className="p-2 min-h-[80px] border-r border-gray-100">
                      {dayClasses.map(cls => (
                        <div
                          key={cls.id}
                          className={`${cls.color} text-white p-2 rounded-lg mb-1 text-xs`}
                        >
                          <div className="font-medium">{cls.subject}</div>
                          <div className="text-xs opacity-90">{cls.room}</div>
                          <div className="text-xs opacity-80">{cls.instructor}</div>
                          <div className="text-xs opacity-70">{cls.duration}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Personal events view
  const PersonalEventsView = () => (
    <div className="space-y-4">
      {personalEvents.map(event => (
        <div key={event.id} className="bg-white rounded-xl shadow-lg p-6 border">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getTypeIcon(event.type)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-gray-600 text-sm">{event.description}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{event.time}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(event.priority)}`}>
                  {event.priority} priority
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => deletePersonalEvent(event.id)}
                className="text-red-600 hover:text-red-800"
                title="Delete event"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {personalEvents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No personal events</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first personal event to get started.</p>
          <button
            onClick={() => setShowAddEvent(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Event
          </button>
        </div>
      )}
    </div>
  );

  // Exam schedule view
  const ExamScheduleView = () => (
    <div className="space-y-4">
      {examSchedule.map(exam => (
        <div key={exam.id} className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{exam.subject}</h3>
                <p className="text-sm text-gray-600">{exam.type.charAt(0).toUpperCase() + exam.type.slice(1)} Examination</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              exam.type === 'final' ? 'bg-red-100 text-red-800' :
              exam.type === 'midterm' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {exam.type}
            </span>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar size={14} className="text-gray-400" />
              <span>{new Date(exam.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-gray-400" />
              <span>{exam.time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={14} className="text-gray-400" />
              <span>{exam.room}</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen size={14} className="text-gray-400" />
              <span>{exam.duration}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Add event modal
  const AddEventModal = () => (
    showAddEvent && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add Personal Event</h3>
            <button
              onClick={() => setShowAddEvent(false)}
              className="text-gray-400 hover:text-gray-600"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newEvent.title || ''}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Event title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Event description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newEvent.date || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  title="Select date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={newEvent.time || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  title="Select time"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newEvent.type || 'personal'}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as PersonalEvent['type'] })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  title="Select event type"
                >
                  <option value="personal">Personal</option>
                  <option value="study">Study</option>
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newEvent.priority || 'medium'}
                  onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as PersonalEvent['priority'] })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  title="Select priority level"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddEvent(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={addPersonalEvent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Event
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'timetable' && <TimetableView />}
        {activeTab === 'personal' && <PersonalEventsView />}
        {activeTab === 'exams' && <ExamScheduleView />}
      </div>
      
      <AddEventModal />
    </div>
  );
};

export default TimetablePage;
