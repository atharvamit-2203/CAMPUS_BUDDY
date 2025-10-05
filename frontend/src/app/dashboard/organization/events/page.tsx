'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { sharedAPI } from '@/services/dashboardAPI';
import { Plus, Calendar, Clock, MapPin } from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time: string;
  venue: string;
  max_participants?: number;
  registration_deadline?: string;
  is_public?: boolean;
  organizer_name?: string;
}

const EventsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Simple create-event form
  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    date: '', // yyyy-mm-dd
    start: '16:00', // HH:mm
    end: '18:00',   // HH:mm
    max_participants: 100,
    event_type: 'organization',
    is_public: true,
  });

  const canCreate = useMemo(() => user && ['organization','faculty','admin'].includes(user.role), [user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await sharedAPI.events.getAllEvents();
      setEvents(Array.isArray(data) ? data : (data.events || []));
    } catch (e: any) {
      setError(e?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAuthenticated) { loadEvents(); } }, [isAuthenticated]);

  const toISO = (d: string, t: string) => new Date(`${d}T${t}:00`).toISOString();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setCreating(true);
    setError(''); setSuccess('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        event_type: form.event_type,
        start_time: toISO(form.date, form.start),
        end_time: toISO(form.date, form.end),
        venue: form.venue,
        max_participants: form.max_participants,
        registration_deadline: toISO(form.date, form.start),
        is_public: form.is_public,
      };
      await sharedAPI.events.createEvent(payload as any);
      setSuccess('Event created');
      setForm({ ...form, title: '', description: '', venue: '' });
      await loadEvents();
    } catch (e: any) {
      setError(e?.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/organization/events" />

      <div className="flex-1 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Organization Events</h1>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/40 text-green-300 px-4 py-2 rounded">{success}</div>}

        {canCreate && (
          <>
            {/* Other Organizations' Upcoming Events */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Other Organizations' Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <div className="text-gray-300">Loading events...</div>
                ) : events.filter(ev => ev.organizer_name !== user?.full_name).length === 0 ? (
                  <div className="text-gray-400">No upcoming events from other organizations.</div>
                ) : (
                  events.filter(ev => ev.organizer_name !== user?.full_name).map(ev => (
                    <div key={ev.id} className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <div className="text-white font-medium text-sm mb-1">{ev.title}</div>
                      <div className="text-gray-300 text-xs mb-2">{ev.organizer_name}</div>
                      <div className="text-gray-400 text-xs flex items-center mb-1"><Calendar className="w-3 h-3 mr-1" /> {new Date(ev.start_time).toLocaleDateString()}</div>
                      <div className="text-gray-400 text-xs flex items-center mb-1"><Clock className="w-3 h-3 mr-1" /> {new Date(ev.start_time).toLocaleTimeString()} - {new Date(ev.end_time).toLocaleTimeString()}</div>
                      <div className="text-gray-400 text-xs flex items-center"><MapPin className="w-3 h-3 mr-1" /> {ev.venue}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleCreate} className="bg-black/40 border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Create New Event</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Title</label>
                  <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Venue</label>
                  <input value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-300 mb-1">Description</label>
                  <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full px-3 py-2 rounded bg:white/5 bg-white/5 border border-white/10 text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Start</label>
                  <input type="time" value={form.start} onChange={e=>setForm({...form,start:e.target.value})} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">End</label>
                  <input type="time" value={form.end} onChange={e=>setForm({...form,end:e.target.value})} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Max participants</label>
                  <input type="number" min={1} value={form.max_participants} onChange={e=>setForm({...form,max_participants:parseInt(e.target.value||'0',10)})} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" />
                </div>
              </div>
              <button disabled={creating} type="submit" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                <Plus className="w-4 h-4 mr-2" />
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-gray-300">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-gray-400">No events found.</div>
          ) : (
            events.map(ev => (
              <div key={ev.id} className="bg-black/40 border border-white/10 rounded-xl p-5">
                <div className="text-white font-semibold text-lg mb-2">{ev.title}</div>
                <div className="text-gray-300 text-sm mb-3">{ev.description}</div>
                <div className="text-gray-400 text-sm flex items-center mb-1"><Calendar className="w-4 h-4 mr-2" /> {new Date(ev.start_time).toLocaleString()}</div>
                <div className="text-gray-400 text-sm flex items-center mb-1"><Clock className="w-4 h-4 mr-2" /> to {new Date(ev.end_time).toLocaleTimeString()}</div>
                <div className="text-gray-400 text-sm flex items-center"><MapPin className="w-4 h-4 mr-2" /> {ev.venue}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;