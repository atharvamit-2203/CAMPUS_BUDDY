'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const Card = ({title, value}:{title:string, value:any}) => (
  <div className="bg-black/40 border border-white/10 rounded-xl p-6">
    <div className="text-gray-400 text-sm">{title}</div>
    <div className="text-3xl font-bold text-white mt-2">{value}</div>
  </div>
);

const AnalyticsPage = () => {
  const [stats, setStats] = React.useState<any>({ members: 0, events: 0, upcoming_events: 0 });
  const [error, setError] = React.useState('');

  const load = async () => {
    try {
      const resp = await fetch(`${API}/organizations/mine/stats`, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}` } });
      if (!resp.ok) throw new Error('Failed to load stats');
      const data = await resp.json();
      setStats(data);
    } catch (e:any) { setError(e?.message || 'Failed to load'); }
  };

  React.useEffect(()=>{ load(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/organization/analytics" />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>
        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Members" value={stats.members} />
          <Card title="All Events" value={stats.events} />
          <Card title="Upcoming Events" value={stats.upcoming_events} />
        </div>
      </div>
    </div>
  );
};
export default AnalyticsPage;
