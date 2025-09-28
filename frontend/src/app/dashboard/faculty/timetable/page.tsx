'use client';

import { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiEdit, 
  FiPlus, 
  FiSave, 
  FiX,
  FiBook,
  FiUsers,
  FiSettings,
  FiDownload,
  FiUpload
} from 'react-icons/fi';

interface TimeSlot {
  id: number;
  day: string;
  time: string;
  subject?: string;
  course?: string;
  semester?: string;
  room?: string;
  duration: number;
  type: 'lecture' | 'practical' | 'tutorial' | 'free';
  students?: number;
}

interface TimetableDay {
  day: string;
  date: string;
  slots: TimeSlot[];
}

export default function FacultyTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    // Simulate API call
    const fetchTimetable = async () => {
      try {
        const mockTimetable: TimetableDay[] = days.map((day, dayIndex) => ({
          day,
          date: `2025-09-${15 + dayIndex}`,
          slots: timeSlots.map((time, timeIndex) => {
            // Generate some sample data
            const slotId = dayIndex * 10 + timeIndex;
            const subjects = [
              { name: 'Data Structures & Algorithms', course: 'Computer Science', semester: '6th Sem', room: 'Room 301' },
              { name: 'Web Development', course: 'Computer Science', semester: '6th Sem', room: 'Lab 2' },
              { name: 'Database Systems', course: 'Computer Science', semester: '6th Sem', room: 'Room 205' },
              { name: 'Free', course: '', semester: '', room: '' }
            ];

            // Assign subjects randomly but realistically
            let assignedSubject = subjects[3]; // Default to free
            if (timeIndex >= 1 && timeIndex <= 6 && dayIndex < 5) { // Working hours, weekdays
              if ((dayIndex + timeIndex) % 3 === 0) assignedSubject = subjects[0];
              else if ((dayIndex + timeIndex) % 3 === 1) assignedSubject = subjects[1];
              else if ((dayIndex + timeIndex) % 3 === 2) assignedSubject = subjects[2];
            }

            return {
              id: slotId,
              day,
              time,
              subject: assignedSubject.name === 'Free' ? undefined : assignedSubject.name,
              course: assignedSubject.course || undefined,
              semester: assignedSubject.semester || undefined,
              room: assignedSubject.room || undefined,
              duration: 60,
              type: assignedSubject.name === 'Free' ? 'free' : 
                    assignedSubject.room?.includes('Lab') ? 'practical' : 'lecture',
              students: assignedSubject.name === 'Free' ? undefined : 45
            } as TimeSlot;
          })
        }));

        setTimetable(mockTimetable);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching timetable:', error);
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  const getSlotColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'practical': return 'bg-green-100 border-green-300 text-green-800';
      case 'tutorial': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'free': return 'bg-gray-50 border-gray-200 text-gray-500';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setShowAddModal(true);
  };

  const saveSlot = (updatedSlot: TimeSlot) => {
    setTimetable(prevTimetable => 
      prevTimetable.map(day => ({
        ...day,
        slots: day.slots.map(slot => 
          slot.id === updatedSlot.id ? updatedSlot : slot
        )
      }))
    );
    setShowAddModal(false);
    setSelectedSlot(null);
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Timetable</h1>
            <p className="text-gray-600">Manage your class schedule and room bookings</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                editMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {editMode ? <FiX className="mr-2" /> : <FiEdit className="mr-2" />}
              {editMode ? 'Cancel Edit' : 'Edit Timetable'}
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center">
              <FiDownload className="mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiBook className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {timetable.reduce((sum, day) => sum + day.slots.filter(slot => slot.type !== 'free').length, 0)}
            </p>
            <p className="text-sm text-gray-600">Weekly Classes</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiClock className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {timetable.reduce((sum, day) => sum + day.slots.filter(slot => slot.type !== 'free').length, 0) * 60} min
            </p>
            <p className="text-sm text-gray-600">Weekly Hours</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiMapPin className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {new Set(timetable.flatMap(day => day.slots.filter(slot => slot.room).map(slot => slot.room))).size}
            </p>
            <p className="text-sm text-gray-600">Different Rooms</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiUsers className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {timetable.reduce((sum, day) => sum + day.slots.filter(slot => slot.students).reduce((s, slot) => s + (slot.students || 0), 0), 0)}
            </p>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiCalendar className="mr-2" />
              Weekly Schedule
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  {days.map(day => (
                    <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map(time => (
                  <tr key={time}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {time}
                    </td>
                    {days.map(day => {
                      const slot = timetable.find(d => d.day === day)?.slots.find(s => s.time === time);
                      return (
                        <td key={`${day}-${time}`} className="px-2 py-2">
                          <div 
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                              slot ? getSlotColor(slot.type) : 'bg-gray-50 border-gray-200'
                            } ${editMode ? 'hover:border-blue-400' : ''}`}
                            onClick={() => editMode && slot && handleSlotClick(slot)}
                          >
                            {slot && slot.subject ? (
                              <div>
                                <div className="font-medium text-sm mb-1">{slot.subject}</div>
                                <div className="text-xs text-gray-600 mb-1">{slot.course}</div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <FiMapPin className="mr-1" />
                                  {slot.room}
                                </div>
                                {slot.students && (
                                  <div className="text-xs text-gray-500 flex items-center mt-1">
                                    <FiUsers className="mr-1" />
                                    {slot.students} students
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-xs text-gray-400">
                                {editMode ? 'Click to add' : 'Free'}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
            <p className="text-sm text-gray-600">Friday, September 13, 2025</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {timetable.find(d => d.day === 'Friday')?.slots
                .filter(slot => slot.subject)
                .map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getSlotColor(slot.type)}`}>
                      <FiBook className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{slot.subject}</h3>
                      <p className="text-sm text-gray-600">{slot.course} - {slot.semester}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{slot.time}</p>
                    <p className="text-xs text-gray-500">{slot.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showAddModal && selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Time Slot - {selectedSlot.day} {selectedSlot.time}
              </h3>
              <SlotEditForm 
                slot={selectedSlot} 
                onSave={saveSlot} 
                onCancel={() => setShowAddModal(false)} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Slot Edit Form Component
interface SlotEditFormProps {
  slot: TimeSlot;
  onSave: (slot: TimeSlot) => void;
  onCancel: () => void;
}

function SlotEditForm({ slot, onSave, onCancel }: SlotEditFormProps) {
  const [formData, setFormData] = useState(slot);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          value={formData.subject || ''}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter subject name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
        <input
          type="text"
          value={formData.course || ''}
          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter course name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
        <input
          type="text"
          value={formData.semester || ''}
          onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter semester"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
        <input
          type="text"
          value={formData.room || ''}
          onChange={(e) => setFormData({ ...formData, room: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter room number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="lecture">Lecture</option>
          <option value="practical">Practical</option>
          <option value="tutorial">Tutorial</option>
          <option value="free">Free</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Students</label>
        <input
          type="number"
          value={formData.students || ''}
          onChange={(e) => setFormData({ ...formData, students: parseInt(e.target.value) || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Number of students"
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
        >
          <FiSave className="mr-2" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center"
        >
          <FiX className="mr-2" />
          Cancel
        </button>
      </div>
    </form>
  );
}
