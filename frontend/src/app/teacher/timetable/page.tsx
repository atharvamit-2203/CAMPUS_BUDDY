'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  X,
  Users,
  CheckCircle,
  Video
} from 'lucide-react';

// Type definitions
interface CourseSchedule {
  id: string;
  courseName: string;
  courseCode: string;
  room: string;
  time: string;
  duration: string;
  day: string;
  semester: string;
  studentCount: number;
  type: 'lecture' | 'lab' | 'tutorial';
  color: string;
}

interface OfficeHours {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'consultation' | 'research' | 'general';
  isAvailable: boolean;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  attendees: string[];
  type: 'faculty' | 'student' | 'committee' | 'research';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

interface Appointment {
  id: string;
  studentName: string;
  studentId: string;
  purpose: string;
  date: string;
  time: string;
  duration: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

const FacultyTimetablePage = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'office-hours' | 'meetings' | 'appointments'>('schedule');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Sample data - would come from API in production
  const [courseSchedule] = useState<CourseSchedule[]>([
    {
      id: '1',
      courseName: 'Data Structures & Algorithms',
      courseCode: 'CS 301',
      room: 'CS-101',
      time: '09:00 AM',
      duration: '1h 30m',
      day: 'Monday',
      semester: 'Fall 2025',
      studentCount: 45,
      type: 'lecture',
      color: 'bg-blue-500'
    },
    {
      id: '2',
      courseName: 'Database Management Systems',
      courseCode: 'CS 401',
      room: 'CS-102',
      time: '11:00 AM',
      duration: '1h 30m',
      day: 'Monday',
      semester: 'Fall 2025',
      studentCount: 38,
      type: 'lecture',
      color: 'bg-green-500'
    },
    {
      id: '3',
      courseName: 'Advanced Programming Lab',
      courseCode: 'CS 302L',
      room: 'Lab-A',
      time: '02:00 PM',
      duration: '3h',
      day: 'Monday',
      semester: 'Fall 2025',
      studentCount: 25,
      type: 'lab',
      color: 'bg-purple-500'
    },
    {
      id: '4',
      courseName: 'Machine Learning',
      courseCode: 'CS 501',
      room: 'CS-103',
      time: '09:00 AM',
      duration: '1h 30m',
      day: 'Tuesday',
      semester: 'Fall 2025',
      studentCount: 32,
      type: 'lecture',
      color: 'bg-orange-500'
    },
    {
      id: '5',
      courseName: 'Software Engineering',
      courseCode: 'CS 402',
      room: 'CS-104',
      time: '11:00 AM',
      duration: '1h 30m',
      day: 'Tuesday',
      semester: 'Fall 2025',
      studentCount: 42,
      type: 'lecture',
      color: 'bg-red-500'
    },
    {
      id: '6',
      courseName: 'DBMS Lab',
      courseCode: 'CS 401L',
      room: 'Lab-B',
      time: '02:00 PM',
      duration: '3h',
      day: 'Tuesday',
      semester: 'Fall 2025',
      studentCount: 20,
      type: 'lab',
      color: 'bg-green-500'
    },
    {
      id: '7',
      courseName: 'Computer Networks',
      courseCode: 'CS 403',
      room: 'CS-105',
      time: '09:00 AM',
      duration: '1h 30m',
      day: 'Wednesday',
      semester: 'Fall 2025',
      studentCount: 40,
      type: 'lecture',
      color: 'bg-teal-500'
    },
    {
      id: '8',
      courseName: 'Research Seminar',
      courseCode: 'CS 599',
      room: 'Seminar Hall',
      time: '11:00 AM',
      duration: '2h',
      day: 'Wednesday',
      semester: 'Fall 2025',
      studentCount: 15,
      type: 'tutorial',
      color: 'bg-indigo-500'
    },
    {
      id: '9',
      courseName: 'Data Structures & Algorithms',
      courseCode: 'CS 301',
      room: 'CS-101',
      time: '09:00 AM',
      duration: '1h 30m',
      day: 'Thursday',
      semester: 'Fall 2025',
      studentCount: 45,
      type: 'lecture',
      color: 'bg-blue-500'
    },
    {
      id: '10',
      courseName: 'Machine Learning Lab',
      courseCode: 'CS 501L',
      room: 'AI Lab',
      time: '02:00 PM',
      duration: '3h',
      day: 'Thursday',
      semester: 'Fall 2025',
      studentCount: 18,
      type: 'lab',
      color: 'bg-orange-500'
    },
    {
      id: '11',
      courseName: 'PhD Research Guidance',
      courseCode: 'Research',
      room: 'Faculty Office',
      time: '10:00 AM',
      duration: '2h',
      day: 'Friday',
      semester: 'Ongoing',
      studentCount: 5,
      type: 'tutorial',
      color: 'bg-gray-500'
    }
  ]);

  const [officeHours, setOfficeHours] = useState<OfficeHours[]>([
    {
      id: '1',
      day: 'Monday',
      startTime: '05:00 PM',
      endTime: '06:00 PM',
      location: 'Faculty Office Room 301',
      type: 'consultation',
      isAvailable: true
    },
    {
      id: '2',
      day: 'Wednesday',
      startTime: '03:00 PM',
      endTime: '05:00 PM',
      location: 'Faculty Office Room 301',
      type: 'research',
      isAvailable: true
    },
    {
      id: '3',
      day: 'Friday',
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      location: 'Faculty Office Room 301',
      type: 'general',
      isAvailable: true
    }
  ]);

  const [meetings] = useState<Meeting[]>([
    {
      id: '1',
      title: 'Department Faculty Meeting',
      description: 'Monthly department meeting to discuss curriculum updates',
      date: '2025-09-15',
      time: '10:00 AM',
      duration: '2h',
      location: 'Conference Room A',
      attendees: ['Dr. Sharma', 'Prof. Patel', 'Dr. Kumar', 'Prof. Singh'],
      type: 'faculty',
      status: 'scheduled'
    },
    {
      id: '2',
      title: 'Research Committee Review',
      description: 'Quarterly research progress review meeting',
      date: '2025-09-18',
      time: '02:00 PM',
      duration: '3h',
      location: 'Research Center',
      attendees: ['Dr. Rao', 'Prof. Verma', 'Dr. Joshi'],
      type: 'committee',
      status: 'scheduled'
    },
    {
      id: '3',
      title: 'Student Project Presentations',
      description: 'Final year project evaluation and presentations',
      date: '2025-09-20',
      time: '09:00 AM',
      duration: '4h',
      location: 'Seminar Hall',
      attendees: ['Final Year Students', 'External Examiner'],
      type: 'student',
      status: 'scheduled'
    }
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      studentName: 'Rahul Sharma',
      studentId: 'CS2021001',
      purpose: 'Thesis guidance discussion',
      date: '2025-09-14',
      time: '05:00 PM',
      duration: '30m',
      status: 'approved'
    },
    {
      id: '2',
      studentName: 'Priya Patel',
      studentId: 'CS2021045',
      purpose: 'Course project doubt clarification',
      date: '2025-09-16',
      time: '03:30 PM',
      duration: '45m',
      status: 'pending'
    },
    {
      id: '3',
      studentName: 'Arjun Kumar',
      studentId: 'CS2020023',
      purpose: 'Research internship discussion',
      date: '2025-09-17',
      time: '02:00 PM',
      duration: '60m',
      status: 'approved'
    }
  ]);

  const [newOfficeHour, setNewOfficeHour] = useState<Partial<OfficeHours>>({
    day: 'Monday',
    startTime: '',
    endTime: '',
    location: 'Faculty Office Room 301',
    type: 'consultation',
    isAvailable: true
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  const addOfficeHour = () => {
    if (newOfficeHour.day && newOfficeHour.startTime && newOfficeHour.endTime) {
      const officeHour: OfficeHours = {
        id: Date.now().toString(),
        day: newOfficeHour.day!,
        startTime: newOfficeHour.startTime!,
        endTime: newOfficeHour.endTime!,
        location: newOfficeHour.location || 'Faculty Office Room 301',
        type: newOfficeHour.type as OfficeHours['type'] || 'consultation',
        isAvailable: true
      };
      setOfficeHours([...officeHours, officeHour]);
      setNewOfficeHour({
        day: 'Monday',
        startTime: '',
        endTime: '',
        location: 'Faculty Office Room 301',
        type: 'consultation',
        isAvailable: true
      });
      setShowAddEvent(false);
    }
  };

  const toggleOfficeHourAvailability = (id: string) => {
    setOfficeHours(officeHours.map(oh => 
      oh.id === id ? { ...oh, isAvailable: !oh.isAvailable } : oh
    ));
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status } : apt
    ));
  };

  const getClassesForDay = (day: string) => {
    return courseSchedule.filter(course => course.day === day);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'ongoing': return 'text-orange-600 bg-orange-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture': return '📚';
      case 'lab': return '🔬';
      case 'tutorial': return '👥';
      case 'consultation': return '💬';
      case 'research': return '🔬';
      case 'general': return '📋';
      case 'faculty': return '👨‍🏫';
      case 'student': return '👨‍🎓';
      case 'committee': return '🏛️';
      default: return '📅';
    }
  };

  // Header component
  const Header = () => (
    <div className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Faculty Schedule</h1>
            <p className="text-gray-600 mt-1">Manage your courses, office hours, meetings, and appointments</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddEvent(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Office Hours</span>
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
            { id: 'schedule', label: 'Course Schedule', icon: Calendar },
            { id: 'office-hours', label: 'Office Hours', icon: Clock },
            { id: 'meetings', label: 'Meetings', icon: Users },
            { id: 'appointments', label: 'Student Appointments', icon: User }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'schedule' | 'office-hours' | 'meetings' | 'appointments')}
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

  // Course schedule view
  const CourseScheduleView = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header with days */}
          <div className="grid grid-cols-7 gap-0 border-b">
            <div className="p-4 bg-gray-50 font-semibold text-gray-700">Time</div>
            {days.map(day => (
              <div key={day} className="p-4 bg-gray-50 font-semibold text-gray-700 text-center">
                {day}
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-7 gap-0 border-b border-gray-100">
              <div className="p-3 bg-gray-50 text-sm font-medium text-gray-600">
                {time}
              </div>
              {days.map(day => {
                const dayClasses = getClassesForDay(day).filter(course => course.time === time);
                return (
                  <div key={`${day}-${time}`} className="p-2 min-h-[100px] border-r border-gray-100">
                    {dayClasses.map(course => (
                      <div
                        key={course.id}
                        className={`${course.color} text-white p-3 rounded-lg mb-1 text-xs`}
                      >
                        <div className="font-medium">{course.courseName}</div>
                        <div className="text-xs opacity-90">{course.courseCode}</div>
                        <div className="text-xs opacity-80">{course.room}</div>
                        <div className="text-xs opacity-70">{course.studentCount} students</div>
                        <div className="text-xs opacity-70">{course.duration}</div>
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

  // Office hours view
  const OfficeHoursView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {officeHours.map(oh => (
          <div key={oh.id} className="bg-white rounded-xl shadow-lg p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getTypeIcon(oh.type)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{oh.day}</h3>
                  <p className="text-sm text-gray-600">{oh.type} hours</p>
                </div>
              </div>
              <button
                onClick={() => toggleOfficeHourAvailability(oh.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  oh.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {oh.isAvailable ? 'Available' : 'Busy'}
              </button>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock size={14} />
                <span>{oh.startTime} - {oh.endTime}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={14} />
                <span>{oh.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {officeHours.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No office hours set</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first office hours to get started.</p>
          <button
            onClick={() => setShowAddEvent(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Office Hours
          </button>
        </div>
      )}
    </div>
  );

  // Meetings view
  const MeetingsView = () => (
    <div className="space-y-4">
      {meetings.map(meeting => (
        <div key={meeting.id} className="bg-white rounded-xl shadow-lg p-6 border">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{new Date(meeting.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{meeting.time} ({meeting.duration})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{meeting.location}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Attendees: {meeting.attendees.join(', ')}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                {meeting.status}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                meeting.type === 'faculty' ? 'bg-blue-100 text-blue-800' :
                meeting.type === 'student' ? 'bg-green-100 text-green-800' :
                meeting.type === 'committee' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {meeting.type}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Appointments view
  const AppointmentsView = () => (
    <div className="space-y-4">
      {appointments.map(appointment => (
        <div key={appointment.id} className="bg-white rounded-xl shadow-lg p-6 border">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-3 rounded-full">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{appointment.studentName}</h3>
                <p className="text-sm text-gray-600">ID: {appointment.studentId}</p>
                <p className="text-sm text-gray-700 mt-2">{appointment.purpose}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{new Date(appointment.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{appointment.time} ({appointment.duration})</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </span>
              {appointment.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateAppointmentStatus(appointment.id, 'approved')}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Approve appointment"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus(appointment.id, 'rejected')}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Reject appointment"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {appointment.status === 'approved' && (
                <div className="flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Start video call"
                  >
                    <Video size={16} />
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Mark as completed"
                  >
                    <CheckCircle size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Add office hours modal
  const AddOfficeHoursModal = () => (
    showAddEvent && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add Office Hours</h3>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                value={newOfficeHour.day || 'Monday'}
                onChange={(e) => setNewOfficeHour({ ...newOfficeHour, day: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                title="Select day"
              >
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={newOfficeHour.startTime || ''}
                  onChange={(e) => setNewOfficeHour({ ...newOfficeHour, startTime: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  title="Select start time"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={newOfficeHour.endTime || ''}
                  onChange={(e) => setNewOfficeHour({ ...newOfficeHour, endTime: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  title="Select end time"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={newOfficeHour.location || ''}
                onChange={(e) => setNewOfficeHour({ ...newOfficeHour, location: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Faculty Office Room 301"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newOfficeHour.type || 'consultation'}
                onChange={(e) => setNewOfficeHour({ ...newOfficeHour, type: e.target.value as OfficeHours['type'] })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                title="Select office hour type"
              >
                <option value="consultation">Student Consultation</option>
                <option value="research">Research Guidance</option>
                <option value="general">General Office Hours</option>
              </select>
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
              onClick={addOfficeHour}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Office Hours
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
        {activeTab === 'schedule' && <CourseScheduleView />}
        {activeTab === 'office-hours' && <OfficeHoursView />}
        {activeTab === 'meetings' && <MeetingsView />}
        {activeTab === 'appointments' && <AppointmentsView />}
      </div>
      
      <AddOfficeHoursModal />
    </div>
  );
};

export default FacultyTimetablePage;
