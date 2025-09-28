'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

const TeamsPage = () => {
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
const resp = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/organizations/mine/members?status=member,approved,selected', {
          headers: { 'Authorization': 'Bearer ' + (typeof window !== 'undefined' ? localStorage.getItem('authToken') : '') }
        });
        if (!resp.ok) throw new Error('Failed to load members');
        const data = await resp.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/organization/teams" />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Teams (Members)</h1>
        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-gray-300">
          {loading ? 'Loading...' : (
            members.length === 0 ? (
              <div>No members yet. Ask students to join from their Organizations page.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="text-left text-gray-400">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Course</th>
                      <th className="py-2 pr-4">Semester</th>
                      <th className="py-2 pr-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-t border-white/10">
                        <td className="py-2 pr-4 text-white">{m.full_name}</td>
                        <td className="py-2 pr-4">{m.email}</td>
                        <td className="py-2 pr-4">{m.course || '-'}</td>
                        <td className="py-2 pr-4">{m.semester || '-'}</td>
                        <td className="py-2 pr-4">{m.joined_at ? new Date(m.joined_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
export default TeamsPage;
