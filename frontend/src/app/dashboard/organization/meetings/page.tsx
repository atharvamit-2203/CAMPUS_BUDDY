'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { Plus } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const MeetingsPage = () => {
  const [form, setForm] = React.useState({ date: '', start: '10:00', end: '11:00', title: 'Team Sync', venue: 'Conference Room', description: 'Weekly sync', max: 20 });
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [events, setEvents] = React.useState<any[]>([]);

  const load = async () => {
    try {
      const resp = await fetch(`${API}/events`, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}` } });
      if (!resp.ok) return;
      const data = await resp.json();
      const mine = (Array.isArray(data) ? data : []).filter((e:any)=>e.organizer_id);
      setEvents(mine.filter((e:any)=> (e.category?.toLowerCase?.() === 'meeting') || (e.event_type?.toLowerCase?.() === 'meeting')));
    } catch {}
  };

  React.useEffect(()=>{ load(); }, []);

  const toISO = (d:string,t:string) => new Date(`${d}T${t}:00`).toISOString();

  const createMeeting = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setCreating(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        event_type: 'meeting',
        start_time: toISO(form.date, form.start),
        end_time: toISO(form.date, form.end),
        venue: form.venue,
        max_participants: form.max
      };
      const resp = await fetch(`${API}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}` },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('Failed to create meeting');
      await load();
    } catch (e:any) { setError(e?.message || 'Failed'); } finally { setCreating(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/organization/meetings" />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Meetings</h1>
        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={createMeeting} className="bg-black/40 border border-white/10 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white" placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
            <input className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white" placeholder="Venue" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} />
            <input type="date" className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required />
            <div className="flex space-x-2">
              <input type="time" className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white" value={form.start} onChange={e=>setForm({...form,start:e.target.value})} required />
              <input type="time" className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white" value={form.end} onChange={e=>setForm({...form,end:e.target.value})} required />
            </div>
            <input className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white md:col-span-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
            <input type="number" min={1} className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white" value={form.max} onChange={e=>setForm({...form,max:parseInt(e.target.value||'0',10)})} />
          </div>
          <button disabled={creating} className="mt-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            <Plus className="w-4 h-4 mr-2" />
            {creating?'Creating...':'Create Meeting'}
          </button>
        </form>

        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl text-white font-semibold mb-3">Your upcoming meetings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev:any)=> (
              <div key={ev.id} className="border border-white/10 rounded p-4">
                <div className="text-white font-medium">{ev.title}</div>
                <div className="text-gray-400 text-sm">{new Date(ev.start_time).toLocaleString()} - {new Date(ev.end_time).toLocaleTimeString()}</div>
                <div className="text-gray-400 text-sm">{ev.venue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default MeetingsPage;
