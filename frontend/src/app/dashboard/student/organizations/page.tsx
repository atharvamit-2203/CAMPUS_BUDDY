'use client';

import React, { useEffect, useState } from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import OrganizationApplicationForm from '@/components/OrganizationApplicationForm';
import { studentAPI } from '@/services/dashboardAPI';
import { Users, UserPlus, Search, Filter } from 'lucide-react';

interface ClubItem {
  id: number;
  name: string;
  organization_name?: string; // for backward compatibility
  description?: string;
  category?: string;
  organization_type?: string;
  created_by?: number;
  member_count?: number;
  membership_status?: string;
  is_member?: boolean;
  is_recruiting?: boolean;
  featured?: boolean;
}

const StudentClubsPage = () => {
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Application form state
  const [applicationForm, setApplicationForm] = useState<{
    isOpen: boolean;
    organizationId: number;
    organizationName: string;
  }>({
    isOpen: false,
    organizationId: 0,
    organizationName: ''
  });

  const load = async () => {
    try {
      setLoading(true);
      const data = await studentAPI.getClubs();
      const allClubs = Array.isArray(data) ? data : [];
      setClubs(allClubs);
    } catch (e: any) {
      setError(e?.message || 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const searchClubs = async () => {
    try {
      setLoading(true);
      const data = await studentAPI.searchClubs(searchQuery, selectedCategory);
      const searchResults = Array.isArray(data) ? data : [];
      setClubs(searchResults);
    } catch (e: any) {
      setError(e?.message || 'Failed to search clubs');
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

  const openApplicationForm = (orgId: number, orgName: string) => {
    setApplicationForm({
      isOpen: true,
      organizationId: orgId,
      organizationName: orgName
    });
  };

  const closeApplicationForm = () => {
    setApplicationForm({
      isOpen: false,
      organizationId: 0,
      organizationName: ''
    });
  };

  const submitApplication = async (applicationData: any) => {
    try {
      setJoining(applicationData.club_id);
      await studentAPI.applyToClub(applicationData.club_id, applicationData);
      await load(); // Refresh the clubs list
    } catch (e: any) {
      throw new Error(e?.message || 'Application submission failed');
    } finally {
      setJoining(null);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/student/organizations" />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Users className="w-6 h-6 mr-2"/>
            Clubs & Organizations
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => searchClubs()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
            >
              Search Clubs
            </button>
            <button 
              onClick={askAI} 
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm"
            >
              {aiLoading ? 'Asking AI…' : 'Recommend Clubs (AI)'}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white"
          >
            <option value="">All Categories</option>
            <option value="academic">Academic</option>
            <option value="arts">Arts</option>
            <option value="business">Business</option>
            <option value="cultural">Cultural</option>
            <option value="entertainment">Entertainment</option>
            <option value="entrepreneurship">Entrepreneurship</option>
            <option value="fitness">Fitness</option>
            <option value="service">Service</option>
            <option value="sports">Sports</option>
            <option value="technology">Technology</option>
          </select>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}
        
        {loading ? (
          <div className="text-gray-300">Loading clubs...</div>
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

           {/* My Clubs Section */}
           {(() => {
             const joinedClubs = clubs.filter(club => {
               return club.membership_status === 'approved' || club.is_member;
             });
             return joinedClubs.length > 0 ? (
               <div className="mb-8">
                 <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                   <Users className="w-6 h-6 mr-3 text-green-400" />
                   My Clubs
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {joinedClubs.map(club => {
                     const name = club.name || club.organization_name || 'Club';
                     return (
                       <div key={club.id} className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
                         <div className="text-white font-semibold text-lg">{name}</div>
                         <div className="text-green-400 text-sm mt-1">
                           Members: {club.member_count ?? 0}
                           {club.category && (
                             <span className="ml-2 px-2 py-1 bg-green-600/30 rounded text-xs">
                               {club.category}
                             </span>
                           )}
                         </div>
                         {club.description && <p className="text-gray-300 text-sm mt-3">{club.description}</p>}
                         <div className="mt-4 inline-flex items-center px-3 py-2 rounded bg-green-600 text-white cursor-default">
                           <Users className="w-4 h-4 mr-2"/>
                           Member
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             ) : null;
           })()}

           {/* Available Clubs Section */}
           <div>
             <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
               <UserPlus className="w-6 h-6 mr-3 text-blue-400" />
               Available Clubs
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {clubs.filter(club => {
                 return !club.is_member && club.membership_status !== 'approved';
               }).map(club => {
                 const name = club.name || club.organization_name || 'Club';
                 const isPending = club.membership_status === 'pending';
                 const btnLabel = joining === club.id ? 'Joining...' : isPending ? 'Pending' : 'Join';
                 const btnDisabled = joining === club.id || isPending;
                 return (
                   <div key={club.id} className="bg-black/40 border border-white/10 rounded-xl p-6">
                     <div className="flex justify-between items-start mb-2">
                       <div className="text-white font-semibold text-lg">{name}</div>
                       {club.featured && (
                         <span className="px-2 py-1 bg-yellow-600/30 text-yellow-300 rounded text-xs">
                           Featured
                         </span>
                       )}
                     </div>
                     <div className="text-gray-400 text-sm mt-1">
                       Members: {club.member_count ?? 0}
                       {club.category && (
                         <span className="ml-2 px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs">
                           {club.category}
                         </span>
                       )}
                     </div>
                     {club.description && <p className="text-gray-300 text-sm mt-3">{club.description}</p>}
                     <button 
                       onClick={() => openApplicationForm(club.id, name)} 
                       disabled={btnDisabled}
                       className={`mt-4 inline-flex items-center px-3 py-2 rounded ${
                         isPending ? 'bg-yellow-600 cursor-wait' : 'bg-green-600 hover:bg-green-700'
                       } text-white disabled:opacity-50`}
                     >
                       <UserPlus className="w-4 h-4 mr-2"/>
                       {btnLabel}
                     </button>
                   </div>
                 );
               })}
             </div>
           </div>
           </>
        )}

        {/* Application Form Modal */}
        <OrganizationApplicationForm
          clubId={applicationForm.organizationId}
          clubName={applicationForm.organizationName}
          isOpen={applicationForm.isOpen}
          onClose={closeApplicationForm}
          onSubmit={submitApplication}
        />
      </div>
    </div>
  );
};

export default StudentClubsPage;