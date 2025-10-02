'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  FiUpload,
  FiBell
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
  const { token } = useAuth();
  const [timetable, setTimetable] = useState<TimetableDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  // Extra Lecture form state
  const [elSubject, setElSubject] = useState('');
  const [elRoom, setElRoom] = useState('');
  const [elDate, setElDate] = useState(''); // YYYY-MM-DD
  const [elStart, setElStart] = useState(''); // HH:MM
  const [elEnd, setElEnd] = useState('');   // HH:MM
  const [elStudentIds, setElStudentIds] = useState('');
  const [elStatus, setElStatus] = useState('');
  // Upcoming toasts
  const [toasts, setToasts] = useState<{ key: string; text: string }[]>([]);

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    // Simulate API call (kept as-is for grid), and set loading false
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

  // Schedule extra lecture handler
  const submitExtraLecture = async () => {
    try {
      setElStatus('');
      if (!elSubject || !elDate || !elStart || !elEnd) {
        setElStatus('Please fill subject, date, start and end time.');
        return;
      }
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const headerToken = token || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : '');
      if (!headerToken) { setElStatus('Please log in.'); return; }
      const startISO = `${elDate}T${elStart}:00`;
      const endISO = `${elDate}T${elEnd}:00`;
      const body: any = { subject: elSubject, start_time: startISO, end_time: endISO, room: elRoom || undefined };
      const ids = (elStudentIds || '').split(',').map(s=>parseInt(s.trim(),10)).filter(n=>Number.isFinite(n));
      if (ids.length > 0) body.student_ids = ids;
      const resp = await fetch(`${API}/faculty/extra-lectures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headerToken}` },
        body: JSON.stringify(body)
      });
      const data = await resp.json().catch(()=>({}));
      if (!resp.ok) throw new Error(data?.detail || 'Failed to schedule extra lecture');
      setElStatus(`Scheduled. Notified ${data?.notified ?? 0} students.`);
      // reset simple inputs except date for convenience
      setElSubject(''); setElRoom(''); setElStart(''); setElEnd(''); setElStudentIds('');
    } catch (e:any) {
      setElStatus(`Error: ${e?.message || e}`);
    }
  };

  // Poll upcoming items for faculty
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headerToken = token || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : '');
    if (!headerToken) return;
    let timer: any;
    const poll = async () => {
      try {
        const resp = await fetch(`${API}/timetable/upcoming?window=10`, { headers: { Authorization: `Bearer ${headerToken}` } });
        const data = await resp.json().catch(()=>({upcoming:[]}));
        const items: any[] = Array.isArray(data.upcoming) ? data.upcoming : [];
        items.forEach((it) => {
          const k = `fac_tt_${new Date().toDateString()}_${it.key}`;
          if (typeof window !== 'undefined' && !localStorage.getItem(k)) {
            localStorage.setItem(k, '1');
            const text = `${it.type === 'extra' ? 'Extra' : 'Upcoming'} lecture in ${it.minutes_until} min: ${it.subject || 'Class'} (${it.start_time})`;
            setToasts((prev) => [...prev, { key: k, text }]);
          }
        });
      } catch {}
      timer = setTimeout(poll, 60_000);
    };
    poll();
    return () => { if (timer) clearTimeout(timer); };
  }, [token]);

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
            <label className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center cursor-pointer">
              <FiUpload className="mr-2" />
              Upload
              <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Handle file upload logic here
                  alert(`File "${file.name}" selected. Upload functionality will be implemented.`);
                }
              }} />
            </label>
          </div>
        </div>

        {/* Extra Lecture Scheduler */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Extra Lecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input value={elSubject} onChange={e=>setElSubject(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Subject" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Course</option>
                <option value="CS101">CS101 - Introduction to Programming</option>
                <option value="CS201">CS201 - Data Structures</option>
                <option value="CS301">CS301 - Database Systems</option>
                <option value="CS401">CS401 - Computer Networks</option>
                <option value="CS501">CS501 - Artificial Intelligence</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch/Class</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Batch</option>
                <option value="CSE-A">CSE-A</option>
                <option value="CSE-B">CSE-B</option>
                <option value="CSE-C">CSE-C</option>
                <option value="IT-A">IT-A</option>
                <option value="IT-B">IT-B</option>
                <option value="ECE-A">ECE-A</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input value={elRoom} onChange={e=>setElRoom(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Room (optional)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={elDate} onChange={e=>setElDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="lecture">Lecture</option>
                <option value="practical">Practical</option>
                <option value="tutorial">Tutorial</option>
                <option value="remedial">Remedial</option>
                <option value="exam">Exam</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={elStart} onChange={e=>setElStart(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={elEnd} onChange={e=>setElEnd(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student IDs (optional)</label>
              <input value={elStudentIds} onChange={e=>setElStudentIds(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., 101,102,103" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={submitExtraLecture} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Schedule</button>
            {elStatus && <span className="text-sm text-gray-600">{elStatus}</span>}
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

      {/* Toasts for upcoming lectures */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div key={t.key} className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center">
            <FiBell className="mr-2" /> {t.text}
          </div>
        ))}
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
