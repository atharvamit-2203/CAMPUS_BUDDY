'use client';

import React, { useEffect, useState } from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { studentAPI } from '@/services/dashboardAPI';

interface EventItem {
  id: number;
  title: string;
  description?: string;
  event_date?: string;
  start_time?: string; // ISO string from backend normalization
  end_time?: string;
  venue?: string;
  organizer_name?: string;
}

const StudentEvents = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await studentAPI.getEvents();
        const list: EventItem[] = Array.isArray(data) ? data : (data.events || []);
        setEvents(list);
      } catch (e: any) {
        setError(e?.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="events" />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Campus Events</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>
          )}

          {loading ? (
            <div className="text-gray-300">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.length === 0 ? (
                <div className="text-gray-400 col-span-full">No upcoming events</div>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="bg-blue-500/20 px-3 py-1 rounded-full">
                        <span className="text-xs text-blue-300">{ev.organizer_name || 'Organizer'}</span>
                      </div>
                      <span className="text-xs text-gray-400">{ev.event_date || (ev.start_time ? new Date(ev.start_time).toLocaleDateString() : '')}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{ev.title}</h3>
                    {ev.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3">{ev.description}</p>
                    )}
                    <div className="space-y-2 mb-4 text-sm text-gray-300">
                      <div className="flex items-center"><span className="w-16 text-gray-400">Time:</span> <span>{ev.start_time ? new Date(ev.start_time).toLocaleTimeString() : ''} {ev.end_time ? `- ${new Date(ev.end_time).toLocaleTimeString()}` : ''}</span></div>
                      {ev.venue && (<div className="flex items-center"><span className="w-16 text-gray-400">Venue:</span> <span>{ev.venue}</span></div>)}
                    </div>
                    <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2 rounded-lg transition-colors">View Details</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentEvents;
