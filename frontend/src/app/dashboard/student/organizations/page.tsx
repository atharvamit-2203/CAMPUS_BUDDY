'use client';

import React, { useEffect, useState } from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { studentAPI } from '@/services/dashboardAPI';
import { Users, UserPlus } from 'lucide-react';

interface OrgItem {
  id: number;
  organization_name: string;
  description?: string;
  owner_user_id?: number;
  member_count?: number;
}

const StudentOrganizationsPage = () => {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await studentAPI.getOrganizations();
      const allOrgs = Array.isArray(data) ? data : (data.organizations || []);
      // Filter out organizations where user is already a member or has approved status
      const availableOrgs = allOrgs.filter(org => {
        const status = (org as any).membership_status;
        return !status || !['member', 'active'].includes(status);
      });
      setOrgs(availableOrgs);
    } catch (e: any) {
      setError(e?.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const askAI = async () => {
    try {
      setAiLoading(true);
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const resp = await fetch(`${API}/ai/club-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}` },
        body: JSON.stringify({})
      });
      if (!resp.ok) throw new Error('AI failed');
      const data = await resp.json();
      setAiRecs(Array.isArray(data.recommendations) ? data.recommendations : []);
    } catch (e:any) { setError(e?.message || 'AI failed'); }
    finally { setAiLoading(false);}  
  };

  const join = async (orgId: number) => {
    try {
      setJoining(orgId);
      await studentAPI.joinOrganization(orgId);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Join failed');
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/student/organizations" />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center"><Users className="w-6 h-6 mr-2"/>Organizations</h1>
          <button onClick={askAI} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm">{aiLoading ? 'Asking AI…' : 'Recommend Clubs (AI)'}</button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}
        {loading ? (
          <div className="text-gray-300">Loading...</div>
        ) : (
          <>
          {aiRecs.length > 0 && (
            <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-white font-semibold mb-2">AI Recommendations</div>
              <ul className="list-disc ml-5 text-gray-200">
                {aiRecs.map((r:any,idx:number)=> (
                  <li key={idx} className="mb-1">{r.id ? <span className="text-blue-300">#{r.id}</span> : null} {r.reason || ''} {r.score ? <span className="text-xs text-gray-400">({r.score})</span> : null}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{orgs.map(org => {
              const name = (org as any).organization_name || (org as any).name || 'Organization';
              const status: string | undefined = (org as any).membership_status;
              const isJoined = status ? ['member','active'].includes(status) : false;
              const isPending = status === 'pending';
              const btnLabel = joining === org.id ? 'Joining...' : isJoined ? 'Joined' : isPending ? 'Pending' : 'Join';
              const btnDisabled = joining === org.id || isJoined || isPending;
              return (
                <div key={org.id} className="bg-black/40 border border-white/10 rounded-xl p-6">
                  <div className="text-white font-semibold text-lg">{name}</div>
                  <div className="text-gray-400 text-sm mt-1">Members: {(org as any).member_count ?? 0}</div>
                  {(org as any).description && <p className="text-gray-300 text-sm mt-3">{(org as any).description}</p>}
                  <button onClick={() => join(org.id)} disabled={btnDisabled}
                    className={`mt-4 inline-flex items-center px-3 py-2 rounded ${isJoined ? 'bg-gray-600 cursor-not-allowed' : isPending ? 'bg-yellow-600 cursor-wait' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                    <UserPlus className="w-4 h-4 mr-2"/>
                    {btnLabel}
                  </button>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentOrganizationsPage;