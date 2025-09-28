
"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Eye, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  formLink: string;
  footfall?: string;
  guest?: string;
}

// --- INITIAL DATA ---
const initialEvents: Event[] = [
  {
    id: 1, 
    title: "Tech Fest 2025", 
    date: "2025-10-15", 
    time: "10:00 AM", 
    venue: "Main Auditorium",
    description: "Annual technical festival showcasing innovation and creativity. Features coding competitions, robotics exhibits, and guest lectures from industry leaders.",
    formLink: "https://forms.gle/example1",
    footfall: "1500+",
    guest: "Dr. Evelyn Reed (AI Researcher)"
  },
  {
    id: 2, 
    title: "Cultural Night", 
    date: "2025-09-25", 
    time: "6:00 PM", 
    venue: "Open Ground",
    description: "Celebrate diversity with music, dance, and cultural performances from around the world. A vibrant evening of art and community.",
    formLink: "https://forms.gle/example2",
    footfall: "800+",
    guest: "The Local Folk Band"
  }
];

// --- MODAL COMPONENTS ---

// 1. Create Event Modal
interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (event: Omit<Event, 'id'>) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ open, onClose, onCreate }) => {
  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '', venue: '', formLink: '', footfall: '', guest: '',
  });
  const [error, setError] = useState('');

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.date || !form.time || !form.venue || !form.formLink) {
      setError('All fields with * are required.');
      return;
    }
    // Simple URL validation for formLink
    try {
        new URL(form.formLink);
    } catch (_) {
        setError('Please enter a valid Google Form link.');
        return;
    }

    setError('');
    const { footfall, guest, ...requiredFields } = form;
    const newEvent: Omit<Event, 'id'> = {
      ...requiredFields,
      ...(footfall && { footfall }),
      ...(guest && { guest }),
    };
    onCreate(newEvent);
    // Reset form and close modal
    setForm({ title: '', description: '', date: '', time: '', venue: '', formLink: '', footfall: '', guest: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative text-gray-800">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close"><X size={24} /></button>
        <h3 className="text-2xl font-bold mb-4 text-black">Create Event</h3>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          <div><label className="block font-semibold mb-1">Event Name*</label><input name="title" value={form.title} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Enter event name" /></div>
          <div><label className="block font-semibold mb-1">Event Description*</label><textarea name="description" value={form.description} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Enter event description" /></div>
          <div><label className="block font-semibold mb-1">Date*</label><input type="date" name="date" value={form.date} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" /></div>
          <div><label className="block font-semibold mb-1">Time*</label><input type="time" name="time" value={form.time} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" /></div>
          <div><label className="block font-semibold mb-1">Venue*</label><input name="venue" value={form.venue} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Enter venue" /></div>
          <div><label className="block font-semibold mb-1">Google Form Link*</label><input name="formLink" value={form.formLink} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="https://forms.gle/..." /></div>
          <div><label className="block font-semibold mb-1">Last Year Footfall (optional)</label><input name="footfall" value={form.footfall} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="e.g., 500+" /></div>
          <div><label className="block font-semibold mb-1">Guest/Alumni/Speaker (optional)</label><input name="guest" value={form.guest} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="e.g., Mr. John Doe" /></div>
        </div>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 mt-4" onClick={handleSubmit}>Create Event</button>
      </div>
    </div>
  );
};


// 2. View Event Modal
interface ViewEventModalProps {
  event: Event | null;
  onClose: () => void;
}

const ViewEventModal: React.FC<ViewEventModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative text-gray-800">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close"><X size={24} /></button>
        <h3 className="text-2xl font-bold mb-4 text-black">{event.title}</h3>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          <div><p className="font-semibold text-black">Description:</p><p>{event.description}</p></div>
          <div><p className="font-semibold text-black">Date:</p><p>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at {event.time}</p></div>
          <div><p className="font-semibold text-black">Venue:</p><p>{event.venue}</p></div>
          {event.guest && <div><p className="font-semibold text-black">Guest/Alumni/Speaker Invited:</p><p>{event.guest}</p></div>}
          {event.footfall && <div><p className="font-semibold text-black">Last Year Footfall:</p><p>{event.footfall}</p></div>}
        </div>
        <a 
          href={event.formLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center justify-center mt-6 w-full text-center bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors"
        >
          <ExternalLink size={18} className="mr-2"/>
          Apply Now
        </a>
      </div>
    </div>
  );
};


// --- UI COMPONENTS ---

// 1. Event Card
interface EventCardProps {
  event: Event;
  onViewEvent: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onViewEvent }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100 flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-600"><Calendar size={16} /><span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span></div>
          <div className="flex items-center space-x-2 text-gray-600"><Clock size={16} /><span>{event.time}</span></div>
          <div className="flex items-center space-x-2 text-gray-600"><MapPin size={16} /><span>{event.venue}</span></div>
        </div>
      </div>
      <div className="flex space-x-3 mt-2">
        <button 
          onClick={() => onViewEvent(event)}
          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Eye size={16} />
          <span>View Event</span>
        </button>
        <a 
          href={event.formLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
        >
          <ExternalLink size={16} />
          <span>Apply Now</span>
        </a>
      </div>
    </div>
  );
};

// --- MAIN EVENT MANAGEMENT COMPONENT ---

const EventManagement = () => {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [viewEvent, setViewEvent] = useState<Event | null>(null);

  const handleCreateEvent = (newEventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...newEventData,
      id: events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1,
    };
    setEvents(prevEvents => [...prevEvents, newEvent]);
  };

  return (
    <div className="p-4 md:p-8 text-gray-900">
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={() => setShowCreateEvent(true)}
          className="bg-purple-600 text-white px-5 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-md"
        >
          <Plus size={20} />
          <span className="font-semibold">Create Event</span>
        </button>
      </div>

      {/* Events Grid */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <EventCard key={event.id} event={event} onViewEvent={setViewEvent} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed">
            <h3 className="text-xl font-semibold text-gray-700">No Events Found</h3>
            <p className="text-gray-500 mt-2">Click "Create Event" to get started.</p>
        </div>
      )}

      {/* Modals are rendered here but only visible when their state is true */}
      <CreateEventModal 
        open={showCreateEvent} 
        onClose={() => setShowCreateEvent(false)} 
        onCreate={handleCreateEvent} 
      />
      <ViewEventModal 
        event={viewEvent} 
        onClose={() => setViewEvent(null)} 
      />
    </div>
  );
};

export default EventManagement;
