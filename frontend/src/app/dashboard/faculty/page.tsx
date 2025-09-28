'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import CampusMiniMap from '@/components/CampusMiniMap';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Brain,
  FileText,
  Clock,
  MapPin,
  Edit,
  Plus,
  Search,
  Filter
} from 'lucide-react';

// Faculty-specific interfaces
interface Course {
  id: number;
  name: string;
  code: string;
  semester: string;
  students_enrolled: number;
  schedule: string;
  credits: number;
  status: 'active' | 'completed' | 'upcoming';
}

interface Student {
  id: number;
  full_name: string;
  student_id: string;
  course: string;
  semester: string;
  cgpa: number;
  attendance_percentage: number;
  recent_submissions: number;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  submitted: number;
  total: number;
  status: 'active' | 'closed' | 'upcoming';
}

interface Research {
  id: string;
  title: string;
  description: string;
  status: 'ongoing' | 'completed' | 'proposed';
  collaborators: number;
  publications: number;
  duration: string;
  domain: string[];
}

interface TimetableSlot {
  id?: number;
  time: string;
  subject: string;
  room: string;
  batch: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectCode?: string;
  faculty?: string;
  classType?: string;
  isEditable?: boolean;
}

interface WeeklyTimetable {
  [day: string]: TimetableSlot[];
}

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyTimetable>({});
  const [editingTimetable, setEditingTimetable] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: string; time: string } | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingSlot, setCancellingSlot] = useState<TimetableSlot | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleOptions, setRescheduleOptions] = useState<any[]>([]);
  
  // Time slots for the timetable grid
  const timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM', 
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM'
  ];
  
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (user) {
      const fetchFacultyData = async () => {
        try {
          // Mock data - replace with actual API calls
          setCourses([
            {
              id: 1,
              name: 'Database Management Systems',
              code: 'CS-301',
              semester: '6th',
              students_enrolled: 45,
              schedule: 'Mon, Wed, Fri - 9:00 AM',
              credits: 4,
              status: 'active'
            },
            {
              id: 2,
              name: 'Software Engineering',
              code: 'CS-401',
              semester: '8th',
              students_enrolled: 38,
              schedule: 'Tue, Thu - 11:00 AM',
              credits: 3,
              status: 'active'
            }
          ]);

          setStudents([
            {
              id: 1,
              full_name: 'John Smith',
              student_id: 'CS20B1001',
              course: 'Computer Science',
              semester: '6th',
              cgpa: 8.5,
              attendance_percentage: 85,
              recent_submissions: 3
            },
            {
              id: 2,
              full_name: 'Sarah Johnson',
              student_id: 'CS20B1002',
              course: 'Computer Science',
              semester: '6th',
              cgpa: 9.2,
              attendance_percentage: 92,
              recent_submissions: 4
            }
          ]);

          setAssignments([
            {
              id: '1',
              title: 'Database Design Project',
              course: 'CS-301',
              dueDate: '2025-09-20',
              submitted: 35,
              total: 45,
              status: 'active'
            },
            {
              id: '2',
              title: 'Software Architecture Report',
              course: 'CS-401',
              dueDate: '2025-09-18',
              submitted: 28,
              total: 38,
              status: 'active'
            }
          ]);

          setResearch([
            {
              id: '1',
              title: 'AI-Powered Educational Analytics',
              description: 'Research on using machine learning for student performance prediction',
              status: 'ongoing',
              collaborators: 3,
              publications: 2,
              duration: '18 months',
              domain: ['Machine Learning', 'Education Technology']
            }
          ]);

          setWeeklyTimetable({
            Monday: [
              { 
                id: 1,
                time: '09:00 AM - 10:00 AM',
                subject: 'Database Systems', 
                room: 'CS-201', 
                batch: 'CS-6A',
                day: 'Monday',
                startTime: '09:00',
                endTime: '10:00',
                subjectCode: 'CS-301',
                classType: 'lecture'
              }
            ],
            Tuesday: [
              { 
                id: 2,
                time: '11:00 AM - 12:00 PM',
                subject: 'Software Engineering', 
                room: 'CS-301', 
                batch: 'CS-8B',
                day: 'Tuesday',
                startTime: '11:00',
                endTime: '12:00',
                subjectCode: 'CS-401',
                classType: 'lecture'
              }
            ],
            Wednesday: [],
            Thursday: [
              { 
                id: 3,
                time: '02:00 PM - 03:00 PM',
                subject: 'Research Meeting', 
                room: 'Faculty Lounge', 
                batch: 'Faculty',
                day: 'Thursday',
                startTime: '14:00',
                endTime: '15:00',
                classType: 'meeting'
              }
            ],
            Friday: [],
            Saturday: []
          });
        } catch (error) {
          console.error('Error fetching faculty data:', error);
        }
      };

      fetchFacultyData();
    }
  }, [user]);

  const updateTimetableSlot = (day: string, timeSlot: string, field: string, value: string) => {
    const updatedTimetable = { ...weeklyTimetable };
    const daySchedule = updatedTimetable[day] || [];
    const slotIndex = daySchedule.findIndex(slot => slot.time === timeSlot);
    
    if (slotIndex >= 0) {
      daySchedule[slotIndex] = { ...daySchedule[slotIndex], [field]: value };
      updatedTimetable[day] = daySchedule;
      setWeeklyTimetable(updatedTimetable);
    }
  };

  const addTimetableSlot = (day: string, timeSlot: string) => {
    const updatedTimetable = { ...weeklyTimetable };
    const daySchedule = updatedTimetable[day] || [];
    
    const newSlot: TimetableSlot = {
      time: timeSlot,
      subject: 'New Subject',
      room: 'TBD',
      batch: 'TBD',
      day: day,
      startTime: timeSlot.split(' - ')[0],
      endTime: timeSlot.split(' - ')[1]
    };
    
    daySchedule.push(newSlot);
    updatedTimetable[day] = daySchedule;
    setWeeklyTimetable(updatedTimetable);
  };

  const removeTimetableSlot = (day: string, timeSlot: string) => {
    const updatedTimetable = { ...weeklyTimetable };
    const daySchedule = updatedTimetable[day] || [];
    updatedTimetable[day] = daySchedule.filter(slot => slot.time !== timeSlot);
    setWeeklyTimetable(updatedTimetable);
  };

  const getSlotForTime = (day: string, timeSlot: string): TimetableSlot | null => {
    const daySchedule = weeklyTimetable[day] || [];
    return daySchedule.find(slot => slot.time === timeSlot) || null;
  };

  const handleEmergencyCancel = async (slot: TimetableSlot) => {
    setCancellingSlot(slot);
    setShowCancelDialog(true);
  };

  const confirmCancelClass = async () => {
    if (!cancellingSlot) return;

    try {
      const response = await fetch('/api/ai/emergency-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          class_id: cancellingSlot.id,
          reason: cancelReason
        })
      });

      const result = await response.json();

      if (result.success) {
        // Remove the slot from timetable
        const updatedTimetable = { ...weeklyTimetable };
        const daySchedule = updatedTimetable[cancellingSlot.day] || [];
        updatedTimetable[cancellingSlot.day] = daySchedule.filter(s => s.id !== cancellingSlot.id);
        setWeeklyTimetable(updatedTimetable);

        // Show success message
        alert(`Class cancelled successfully! ${result.affected_students} students notified.`);
        
        // Ask if they want to reschedule
        if (confirm('Would you like to see rescheduling suggestions?')) {
          await getSuggestions(cancellingSlot.id);
        }
      } else {
        alert('Error cancelling class: ' + result.error);
      }
    } catch (error) {
      alert('Error cancelling class. Please try again.');
    }

    setShowCancelDialog(false);
    setCancellingSlot(null);
    setCancelReason('');
  };

  const getSuggestions = async (classId: number) => {
    try {
      const response = await fetch('/api/ai/reschedule-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ class_id: classId })
      });

      const result = await response.json();

      if (result.suggestions) {
        setRescheduleOptions(result.suggestions);
        setShowRescheduleDialog(true);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const handleReschedule = async (suggestion: any) => {
    try {
      // Implementation would update the timetable with new slot
      alert(`Class rescheduled to ${suggestion.day} ${suggestion.start_time}-${suggestion.end_time}`);
      setShowRescheduleDialog(false);
    } catch (error) {
      alert('Error rescheduling class');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome, Prof. {user?.full_name}</h2>
            <p className="text-gray-300">Manage your courses and students effectively</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-400">{courses.length}</div>
            <div className="text-sm text-gray-400">Active Courses</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-xl font-bold text-white">{courses.length}</div>
              <div className="text-sm text-gray-400">Courses</div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-xl font-bold text-white">{students.length}</div>
              <div className="text-sm text-gray-400">Students</div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-xl font-bold text-white">{assignments.length}</div>
              <div className="text-sm text-gray-400">Active Assignments</div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-xl font-bold text-white">{research.length}</div>
              <div className="text-sm text-gray-400">Research Projects</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Clock className="w-6 h-6 mr-2 text-blue-400" />
            Weekly Timetable
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setEditingTimetable(!editingTimetable)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                editingTimetable 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Edit className="w-4 h-4" />
              <span>{editingTimetable ? 'Save Changes' : 'Edit Schedule'}</span>
            </button>
          </div>
        </div>
        
        {/* Timetable Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px] bg-white/5 rounded-lg border border-white/10">
            {/* Header Row */}
            <div className="grid grid-cols-7 gap-0 border-b border-white/10">
              <div className="p-3 text-center text-gray-300 font-medium bg-white/5">Time</div>
              {weekDays.map(day => (
                <div key={day} className="p-3 text-center text-gray-300 font-medium bg-white/5 border-l border-white/10">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Time Slots */}
            {timeSlots.map(timeSlot => (
              <div key={timeSlot} className="grid grid-cols-7 gap-0 border-b border-white/10 last:border-b-0">
                {/* Time Column */}
                <div className="p-3 text-center text-blue-400 font-medium bg-white/5 border-r border-white/10 text-sm">
                  {timeSlot}
                </div>
                
                {/* Day Columns */}
                {weekDays.map(day => {
                  const slot = getSlotForTime(day, timeSlot);
                  return (
                    <div key={`${day}-${timeSlot}`} className="p-2 border-l border-white/10 min-h-[80px] relative">
                      {slot ? (
                        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-2 h-full group">
                          {editingTimetable ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={slot.subject}
                                onChange={(e) => updateTimetableSlot(day, timeSlot, 'subject', e.target.value)}
                                className="w-full bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-xs"
                                placeholder="Subject"
                              />
                              <input
                                type="text"
                                value={slot.batch}
                                onChange={(e) => updateTimetableSlot(day, timeSlot, 'batch', e.target.value)}
                                className="w-full bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-xs"
                                placeholder="Batch"
                              />
                              <input
                                type="text"
                                value={slot.room}
                                onChange={(e) => updateTimetableSlot(day, timeSlot, 'room', e.target.value)}
                                className="w-full bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-xs"
                                placeholder="Room"
                              />
                              <button 
                                onClick={() => removeTimetableSlot(day, timeSlot)}
                                className="text-red-400 hover:text-red-300 text-xs"
                                title="Remove slot"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs h-full flex flex-col justify-center relative">
                              <div className="text-white font-medium truncate">{slot.subject}</div>
                              <div className="text-gray-300 truncate">{slot.batch}</div>
                              <div className="text-gray-400 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {slot.room}
                              </div>
                              
                              {/* Emergency Cancel Button */}
                              <button
                                onClick={() => handleEmergencyCancel(slot)}
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Emergency Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        editingTimetable && (
                          <button
                            onClick={() => addTimetableSlot(day, timeSlot)}
                            className="w-full h-full border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-400 transition-colors"
                            title="Add class to this time slot"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {editingTimetable && (
          <div className="mt-4 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm mb-3">
              <strong>Editing Mode:</strong> Click on empty slots to add classes, or edit existing ones directly. Changes can be saved to the database.
            </p>
            <div className="flex space-x-2">
              <button 
                onClick={() => setEditingTimetable(false)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Save & Finish Editing
              </button>
              <button 
                onClick={() => setEditingTimetable(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-96 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Cancel Class</h3>
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                Are you sure you want to cancel this class?
              </p>
              {cancellingSlot && (
                <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3 mb-4">
                  <div className="text-white font-medium">{cancellingSlot.subject}</div>
                  <div className="text-gray-300">{cancellingSlot.batch}</div>
                  <div className="text-gray-400">{cancellingSlot.day} {cancellingSlot.time}</div>
                </div>
              )}
              <label className="block text-gray-300 mb-2">Reason for cancellation:</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-black/40 text-white border border-white/20 rounded px-3 py-2 h-20"
                placeholder="Optional reason for cancellation..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={confirmCancelClass}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                Cancel Class
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
              >
                Keep Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Suggestions Dialog */}
      {showRescheduleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-[600px] border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">AI Reschedule Suggestions</h3>
            <p className="text-gray-300 mb-4">
              Here are the best available time slots based on both your and students&apos; schedules:
            </p>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {rescheduleOptions.map((option, index) => (
                <div key={index} className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">
                        {option.day.charAt(0).toUpperCase() + option.day.slice(1)} {option.start_time} - {option.end_time}
                      </div>
                      <div className="text-gray-300 text-sm">{option.reason}</div>
                      <div className="text-gray-400 text-sm">
                        Available rooms: {option.available_rooms?.length || 0}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-green-400 font-medium">
                        Score: {option.preference_score}/100
                      </div>
                      <button
                        onClick={() => handleReschedule(option)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowRescheduleDialog(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Assignments */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-yellow-400" />
          Recent Assignments
        </h3>
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white font-medium">{assignment.title}</div>
                <div className="text-gray-400 text-sm">Due: {assignment.dueDate}</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-medium">
                  {assignment.submitted}/{assignment.total} submitted
                </div>
                <div className="text-gray-400 text-sm">
                  {Math.round((assignment.submitted / assignment.total) * 100)}% completion
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Course Management</h2>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add Course</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">{course.name}</h3>
                <p className="text-gray-400">{course.code} • {course.semester} Semester</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                course.status === 'active' ? 'bg-green-600/20 text-green-400' :
                course.status === 'upcoming' ? 'bg-blue-600/20 text-blue-400' :
                'bg-gray-600/20 text-gray-400'
              }`}>
                {course.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Students Enrolled:</span>
                <span className="text-white">{course.students_enrolled}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Schedule:</span>
                <span className="text-white">{course.schedule}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Credits:</span>
                <span className="text-white">{course.credits}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                View Details
              </button>
              <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors">
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Student Analytics</h2>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Student Performance Overview</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-gray-300">Student</th>
                <th className="text-left p-4 text-gray-300">ID</th>
                <th className="text-left p-4 text-gray-300">Course</th>
                <th className="text-left p-4 text-gray-300">CGPA</th>
                <th className="text-left p-4 text-gray-300">Attendance</th>
                <th className="text-left p-4 text-gray-300">Submissions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4 text-white">{student.full_name}</td>
                  <td className="p-4 text-gray-400">{student.student_id}</td>
                  <td className="p-4 text-gray-400">{student.course}</td>
                  <td className="p-4">
                    <span className={`font-medium ${
                      student.cgpa >= 8.5 ? 'text-green-400' :
                      student.cgpa >= 7.0 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {student.cgpa}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`font-medium ${
                      student.attendance_percentage >= 85 ? 'text-green-400' :
                      student.attendance_percentage >= 75 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {student.attendance_percentage}%
                    </span>
                  </td>
                  <td className="p-4 text-white">{student.recent_submissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/faculty" />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Faculty Dashboard</h1>
              <p className="text-gray-400">{user?.department || 'Computer Science Department'}</p>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-4">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'courses', label: 'Courses', icon: BookOpen },
                { id: 'students', label: 'Students', icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'students' && renderStudents()}
      </div>
    </div>
  );
};

export default FacultyDashboard;
