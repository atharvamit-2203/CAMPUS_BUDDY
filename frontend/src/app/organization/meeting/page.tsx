
"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Video, 
  Calendar, 
  Clock, 
  User, 
  Briefcase,
  Monitor,
  X 
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Meeting {
  id: number;
  name: string;
  position: string;
  date: string;
  time: string;
  platform: string;
  status: 'Join' | 'Scheduled';
}

// --- INITIAL DATA ---
const initialMeetings: Meeting[] = [
  { 
    id: 1,
    name: 'Priya Mehta', 
    position: 'Social Media Manager', 
    date: '2025-09-12', 
    time: '14:00', // Using 24-hour format for input consistency
    platform: 'Google Meet', 
    status: 'Scheduled' 
  },
  { 
    id: 2,
    name: 'Arjun Sharma', 
    position: 'Creative Head', 
    date: '2025-09-10', 
    time: '15:00',
    platform: 'Google Meet', 
    status: 'Join' 
  },
];

// --- MODAL COMPONENT ---
interface ScheduleMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (meeting: Omit<Meeting, 'id' | 'status'>) => void;
}

const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({ open, onClose, onSchedule }) => {
  const [form, setForm] = useState({
    name: '', position: '', date: '', time: '', platform: 'Google Meet',
  });
  const [error, setError] = useState('');

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.position || !form.date || !form.time || !form.platform) {
      setError('All fields are required.');
      return;
    }
    setError('');
    onSchedule(form);
    setForm({ name: '', position: '', date: '', time: '', platform: 'Google Meet' }); // Reset form
    onClose();
  };
  
  // Get today's date for min attribute on date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative text-gray-800">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close"><X size={24} /></button>
        <h3 className="text-2xl font-bold mb-4 text-black">Schedule a Meeting</h3>
        <div className="space-y-4">
          <div><label className="block font-semibold mb-1">Interviewee Name*</label><input name="name" value={form.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="e.g., Jane Doe" /></div>
          <div><label className="block font-semibold mb-1">Position Applied*</label><input name="position" value={form.position} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="e.g., Marketing Head" /></div>
          <div><label className="block font-semibold mb-1">Date*</label><input type="date" name="date" min={today} value={form.date} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" /></div>
          <div><label className="block font-semibold mb-1">Time*</label><input type="time" name="time" value={form.time} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" /></div>
          <div>
            <label className="block font-semibold mb-1">Platform*</label>
            <select name="platform" value={form.platform} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded bg-white">
                <option>Google Meet</option>
                <option>Zoom</option>
                <option>Microsoft Teams</option>
                <option>In-person</option>
            </select>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
        <button className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 mt-5 font-semibold" onClick={handleSubmit}>Schedule Meeting</button>
      </div>
    </div>
  );
};


// --- UI COMPONENT: Meeting Card ---
interface MeetingCardProps {
  meeting: Meeting;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
  // Format time from "HH:mm" to "h:mm AM/PM"
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
     <div className="border border-gray-200 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h4 className="font-bold text-lg text-gray-900 flex items-center"><User size={18} className="mr-2 text-purple-600"/>Interview with {meeting.name}</h4>
          <p className="text-gray-600 flex items-center mt-1"><Briefcase size={16} className="mr-2 text-gray-500"/>{meeting.position} Position</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center mb-1 sm:mb-0"><Calendar size={15} className="mr-1.5"/>{new Date(meeting.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="flex items-center mb-1 sm:mb-0"><Clock size={15} className="mr-1.5"/>{formatTime(meeting.time)}</span>
            <span className="flex items-center"><Monitor size={15} className="mr-1.5"/>{meeting.platform}</span>
          </div>
        </div>
        {meeting.status === 'Join' ? (
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center">
            <Video size={16} />
            <span className="font-semibold">Join</span>
          </button>
        ) : (
          <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-not-allowed font-medium w-full sm:w-auto text-center">
            Scheduled
          </span>
        )}
      </div>
    </div>
  );
};


// --- MAIN CALENDAR COMPONENT ---
const MeetingCalendar = () => {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleScheduleMeeting = (newMeetingData: Omit<Meeting, 'id' | 'status'>) => {
    const newMeeting: Meeting = {
      ...newMeetingData,
      id: meetings.length > 0 ? Math.max(...meetings.map(m => m.id)) + 1 : 1,
      status: 'Scheduled', // New meetings are always 'Scheduled' initially
    };
    setMeetings(prevMeetings => [...prevMeetings, newMeeting].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  return (
    <div className="p-4 md:p-8 text-gray-900">
      {/* Header */}
        <div className="flex items-center justify-end mb-8">
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all flex items-center gap-2"
            onClick={() => setShowScheduleModal(true)}
          >
            <Plus size={20} />
            <span className="font-semibold">Schedule Meeting</span>
          </button>
        </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))
        ) : (
             <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                <h3 className="text-xl font-semibold text-gray-700">No Meetings Scheduled</h3>
                <p className="text-gray-500 mt-2">Click "Schedule Meeting" to add one.</p>
            </div>
        )}
      </div>

      {/* Modal */}
      <ScheduleMeetingModal 
        open={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)} 
        onSchedule={handleScheduleMeeting} 
      />
    </div>
  );
};

export default MeetingCalendar;
