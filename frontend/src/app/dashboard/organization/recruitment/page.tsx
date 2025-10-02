'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { Check, X, Star, Search, Shuffle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const RecruitmentPage = () => {
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards');

  // Details side panel
  const [selected, setSelected] = React.useState<any | null>(null);
  const [details, setDetails] = React.useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  // Animation + history (undo)
  const [anim, setAnim] = React.useState<null | { id: number; toX: number; toY: number; rotate: number }>(null);
  const [history, setHistory] = React.useState<{ userId: number; prevStatus: string; candidate: any; newStatus: string }[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API}/organizations/mine/members?status=pending`, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}` } });
      if (!resp.ok) throw new Error('Failed to load candidates');
      const data = await resp.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const updateStatus = async (userId: number, status: string) => {
    try {
      const resp = await fetch(`${API}/organizations/members/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`
        },
        body: JSON.stringify({ status })
      });
      if (!resp.ok) throw new Error('Update failed');
      // Optimistically remove from current list if moved out of filter
      if (status === 'rejected' || status === 'active') {
        setMembers(prev => prev.filter(m => m.id !== userId));
      } else {
        await load();
      }
      if (selected && selected.id === userId) {
        setSelected(null);
        setDetails(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Update failed');
    }
  };

  const filtered = members.filter(m => {
    const q = query.toLowerCase();
    return !q || (m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.course?.toLowerCase().includes(q));
  });

  const viewDetails = async (userId: number) => {
    try {
      setDetailsLoading(true);
      setSelected(filtered.find(f => f.id === userId) || null);
      const resp = await fetch(`${API}/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}` }
      });
      if (!resp.ok) throw new Error('Failed to load details');
      const data = await resp.json();
      setDetails(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Swipe/drag state for top card
  const [drag, setDrag] = React.useState({ active: false, startX: 0, startY: 0, x: 0, y: 0, rotate: 0 });
  const threshold = 120; // px

  const topCandidate = filtered[0];

  const onPointerDown = (e: React.PointerEvent) => {
    if (!topCandidate) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ active: true, startX: e.clientX, startY: e.clientY, x: 0, y: 0, rotate: 0 });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const rot = Math.max(-15, Math.min(15, dx / 10));
    setDrag(prev => ({ ...prev, x: dx, y: dy, rotate: rot }));
  };
  const decide = (c: any, status: 'selected' | 'rejected' | 'shortlisted') => {
    setHistory(h => [{ userId: c.id, prevStatus: c.status ?? 'pending', candidate: c, newStatus: status }, ...h]);
    // Start fly-out animation
    if (status === 'selected') setAnim({ id: c.id, toX: 1000, toY: drag.y, rotate: 20 });
    else if (status === 'rejected') setAnim({ id: c.id, toX: -1000, toY: drag.y, rotate: -20 });
    else setAnim({ id: c.id, toX: 0, toY: -800, rotate: 0 });
    setDrag({ active: false, startX: 0, startY: 0, x: 0, y: 0, rotate: 0 });
    // Let the animation play, then update backend
    setTimeout(() => {
      // Map frontend statuses to database enum values
      const dbStatus = status === 'selected' ? 'active' : 
                      status === 'shortlisted' ? 'pending' : 
                      status === 'rejected' ? 'rejected' : status;
      updateStatus(c.id, dbStatus);
      setAnim(null);
    }, 260);
  };

  const onPointerUp = async (e: React.PointerEvent) => {
    if (!drag.active || !topCandidate) return;
    const { x, y } = drag;
    setDrag(prev => ({ ...prev, active: false }));
    if (x > threshold) {
      decide(topCandidate, 'selected');
      return;
    }
    if (x < -threshold) {
      decide(topCandidate, 'rejected');
      return;
    }
    if (y < -threshold) {
      decide(topCandidate, 'shortlisted');
      return;
    }
    // snap back
    setDrag({ active: false, startX: 0, startY: 0, x: 0, y: 0, rotate: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/organization/recruitment" />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Recruitment</h1>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button onClick={async ()=>{
                  const last = history[0];
                  if (!last) return;
                  setHistory(h => h.slice(1));
                  // Only reinsert if card was removed from list
                  if (last.newStatus === 'selected' || last.newStatus === 'rejected') {
                    setMembers(prev => [last.candidate, ...prev]);
                  }
                  try { await updateStatus(last.userId, last.prevStatus); } catch {}
                }} className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded">Undo</button>
              )}
              <button onClick={() => setViewMode(v => v === 'cards' ? 'table' : 'cards')} className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded flex items-center gap-2">
                <Shuffle className="w-4 h-4" /> {viewMode === 'cards' ? 'Table View' : 'Cards View'}
              </button>
            </div>
          </div>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 mr-2"/>
            <input className="bg-transparent outline-none text-white" placeholder="Search candidates" value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}

        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          {loading ? (
            <div className="text-gray-300">Loading...</div>
          ) : viewMode === 'cards' ? (
            <div className="relative w-full max-w-xl mx-auto" style={{minHeight: '440px'}}>
              {/* Card stack */}
              {filtered.slice(0, 5).map((c:any, idx:number) => {
                const isTop = idx === 0;
                const isAnimating = anim && anim.id === c.id && isTop;
                const translate = isTop ? `translate(${drag.x}px, ${drag.y}px)` : `translate(0, ${idx * 6}px)`;
                const rotate = isTop ? `rotate(${drag.rotate}deg)` : 'rotate(0deg)';
                const scale = isTop ? 1 : 1 - idx * 0.02;
                const opacity = isTop ? 1 : 0.95 - idx * 0.05;
                const finalTransform = isAnimating ? `translate(${anim!.toX}px, ${anim!.toY}px) rotate(${anim!.rotate}deg) scale(1)` : `${translate} ${rotate} scale(${scale})`;
                return (
                  <div
                    key={c.id}
                    className={`absolute inset-0 mx-auto w-full h-[420px] bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm select-none ${isAnimating ? 'pointer-events-none' : ''}`}
                    style={{ transform: finalTransform, transition: isAnimating ? 'transform 0.35s ease, opacity 0.35s ease' : (drag.active && isTop ? 'none' : 'transform 0.2s ease'), zIndex: 100 - idx, opacity }}
                    onPointerDown={isTop ? onPointerDown : undefined}
                    onPointerMove={isTop ? onPointerMove : undefined}
                    onPointerUp={isTop ? onPointerUp : undefined}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold text-white">{c.full_name}</div>
                        <div className="text-sm text-gray-400">{c.email}</div>
                      </div>
                      <button onClick={()=>viewDetails(c.id)} className="text-blue-300 hover:text-blue-200 text-sm underline">Details</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                      <div className="bg-white/5 border border-white/10 rounded p-3">
                        <div className="text-gray-400">Course</div>
                        <div className="text-white">{c.course || '-'}</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded p-3">
                        <div className="text-gray-400">Semester</div>
                        <div className="text-white">{c.semester || '-'}</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded p-3 col-span-2">
                        <div className="text-gray-400">Status</div>
                        <div className="text-white">{c.status ?? '—'}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="absolute left-0 right-0 bottom-4 flex items-center justify-center gap-4">
                      <button onClick={()=>decide(c, 'shortlisted')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30">
                        <Star className="w-4 h-4"/> Shortlist
                      </button>
                      <button onClick={()=>decide(c, 'rejected')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30">
                        <X className="w-4 h-4"/> Reject
                      </button>
                      <button onClick={()=>decide(c, 'selected')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30">
                        <Check className="w-4 h-4"/> Select
                      </button>
                    </div>

                    {/* Swipe overlays */}
                    {idx === 0 && (
                      <>
                        {drag.x > 40 && (
                          <div className="absolute top-4 right-4 px-3 py-1 border-2 border-green-400 text-green-300 rounded rotate-6 bg-green-500/10">SELECT</div>
                        )}
                        {drag.x < -40 && (
                          <div className="absolute top-4 left-4 px-3 py-1 border-2 border-red-400 text-red-300 rounded -rotate-6 bg-red-500/10">REJECT</div>
                        )}
                        {drag.y < -40 && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-16 px-3 py-1 border-2 border-yellow-400 text-yellow-300 rounded bg-yellow-500/10">SHORTLIST</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="h-[420px] flex items-center justify-center text-gray-400">No candidates to review.</div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="text-left text-gray-400">
                  <tr>
                    <th className="py-2 pr-4">Candidate</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Course</th>
                    <th className="py-2 pr-4">Semester</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c:any) => (
                    <tr key={c.id} className="border-t border-white/10">
                      <td className="py-2 pr-4 text-white">{c.full_name}</td>
                      <td className="py-2 pr-4">{c.email}</td>
                      <td className="py-2 pr-4">{c.course || '-'}</td>
                      <td className="py-2 pr-4">{c.semester || '-'}</td>
                      <td className="py-2 pr-4">{c.status ?? '—'}</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center space-x-3">
                          <button onClick={()=>viewDetails(c.id)} className="text-blue-400 hover:text-blue-300 underline text-sm">View</button>
                          <button onClick={()=>decide(c, 'shortlisted')} className="text-yellow-400 hover:text-yellow-300" title="Shortlist"><Star className="w-4 h-4"/></button>
                          <button onClick={()=>decide(c, 'selected')} className="text-green-400 hover:text-green-300" title="Select"><Check className="w-4 h-4"/></button>
                          <button onClick={()=>decide(c, 'rejected')} className="text-red-400 hover:text-red-300" title="Reject"><X className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div className="fixed right-0 top-0 h-full w-full md:w-[420px] bg-black/70 md:bg-black/60 border-l border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Candidate Details</h2>
              <button onClick={()=>{setSelected(null); setDetails(null);}} className="text-gray-300 hover:text-white">Close</button>
            </div>
            {detailsLoading ? (
              <div className="text-gray-300">Loading details...</div>
            ) : details ? (
              <div className="space-y-4 text-gray-200">
                <div>
                  <div className="text-lg font-medium text-white">{details.user?.full_name}</div>
                  <div className="text-sm text-gray-400">{details.user?.email}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-400">Course:</span> {details.user?.course || '-'}</div>
                  <div><span className="text-gray-400">Semester:</span> {details.user?.semester || '-'}</div>
                  <div><span className="text-gray-400">Department:</span> {details.user?.department || '-'}</div>
                  <div><span className="text-gray-400">Phone:</span> {details.user?.phone_number || '-'}</div>
                </div>
                {details.user?.bio && (
                  <div>
                    <div className="text-gray-400 mb-1">Bio</div>
                    <div className="bg-white/5 border border-white/10 rounded p-3 text-sm">{details.user.bio}</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-400 mb-1">Interests</div>
                  <div className="flex flex-wrap gap-2">
                    {(details.interests || []).length === 0 ? (
                      <span className="text-gray-500">No interests set</span>
                    ) : (
                      details.interests.map((it: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs">{it}</span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Skills</div>
                  <div className="space-y-1">
                    {(details.skills || []).length === 0 ? (
                      <span className="text-gray-500">No skills added</span>
                    ) : (
                      details.skills.map((sk: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 rounded px-2 py-1 text-sm">
                          <div className="text-white">{sk.skill_name}</div>
                          <div className="text-gray-400">{sk.category}</div>
                          <div className="text-gray-300">Lvl {sk.proficiency_level}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button onClick={()=>updateStatus(selected.id, 'active')} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded">Select</button>
                  <button onClick={()=>updateStatus(selected.id, 'rejected')} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded">Reject</button>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Select a candidate to view details.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default RecruitmentPage;
