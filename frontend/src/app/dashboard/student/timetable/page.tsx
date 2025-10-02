'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { studentAPI } from '@/services/dashboardAPI';
import { useAuth } from '@/contexts/AuthContext';

const daysOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// Robust time parsing utilities that accept formats like:
// - "09:00 - 10:00"
// - "9-10 am" / "2 to 3 pm" / "2pm-3pm"
// - "09:00 AM - 10:00 AM"
function timeTokenToMinutes(token: string): number | null {
  if (!token) return null;
  let t = token.toLowerCase().replace(/\./g, '').trim(); // remove dots in a.m./p.m.
  // Remove extra spaces around am/pm
  t = t.replace(/\s+(am|pm)$/i, '$1');
  const am = /am$/.test(t);
  const pm = /pm$/.test(t);
  t = t.replace(/am$|pm$/,'').trim();
  // Accept H, HH, H:MM, HH:MM
  const m = t.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  let min = parseInt(m[2] || '0', 10);
  if (h === 12 && am) h = 0; // 12AM -> 0
  if (pm && h < 12) h += 12; // add 12 for PM (except 12PM)
  if (!am && !pm) {
    // No suffix: leave as-is (assume 24h) if 0-23, else clamp
    if (h > 23) h = h % 24;
  }
  return h*60 + min;
}

function normalizeRange24(range: string): { startMin: number, endMin: number, normalized24: string } | null {
  if (!range) return null;
  let s = range.toLowerCase().replace(/\./g,'');
  s = s.replace(/–|—/g,'-'); // en/em dashes
  s = s.replace(/\s+to\s+/g,'-');
  s = s.replace(/\s+/g,' ').trim();
  let parts = s.split('-').map(p=>p.trim()).filter(Boolean);
  if (parts.length !== 2) {
    // Fallback extractor: find first two time tokens anywhere
    const toks = Array.from(s.matchAll(/(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/g)).map(m=>m[0].trim());
    if (toks.length >= 2) {
      parts = [toks[0], toks[1]];
    } else {
      return null;
    }
  }
  const [aRaw0, bRaw0] = parts;
  const aRaw = aRaw0.trim();
  const bRaw = bRaw0.trim();
  // If second part lacks am/pm but first has, append same suffix to second for parsing
  const firstHasSuffix = /(am|pm)$/.test(aRaw);
  const bToken = firstHasSuffix && !/(am|pm)$/.test(bRaw) ? `${bRaw}${aRaw.slice(-2)}` : bRaw;
  const aMin = timeTokenToMinutes(aRaw);
  const bMinRaw = timeTokenToMinutes(bToken);
  if (aMin == null || bMinRaw == null) return null;
  // If end <= start, assume it rolls into PM or next hour block; add 12h if reasonable
  let bMin = bMinRaw;
  if (bMin <= aMin && bMin + 12*60 > aMin && bMin < 12*60) {
    bMin += 12*60; // e.g., 2-1 (missing pm) -> 14:00-15:00
  }
  const pad = (n:number)=>n.toString().padStart(2,'0');
  const fmt = (min:number)=>`${pad(Math.floor(min/60))}:${pad(min%60)}`;
  return { startMin: aMin, endMin: bMin, normalized24: `${fmt(aMin)} - ${fmt(bMin)}` };
}

function minutesToAmPm(min:number): string {
  const h24 = Math.floor(min/60) % 24; const m = min % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${suffix}`;
}

function formatRangeAmPm(range: string): string {
  // If input already looks like AM/PM on both sides, just return normalized formatting
  const n = normalizeRange24(range);
  if (!n) return range;
  return `${minutesToAmPm(n.startMin)} - ${minutesToAmPm(n.endMin)}`;
}

function rangesOverlap(a: string, b: string): boolean {
  const A = normalizeRange24(a);
  const B = normalizeRange24(b);
  if (!A || !B) {
    // Fallback: if parser fails, fall back to strict string equality (trim spaces)
    return (a || '').trim() === (b || '').trim();
  }
  return A.startMin < B.endMin && A.endMin > B.startMin; // strict overlap
}

function parseStartMinutes(timeRange: string): number {
  const n = normalizeRange24(timeRange);
  if (!n) return 0;
  return n.startMin;
}

const StudentTimetable = () => {
  const { token, isAuthenticated } = useAuth();
  const [schedule, setSchedule] = useState<Record<string, any[]>>({});
  const [source, setSource] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [pickedName, setPickedName] = useState('');
  const [hasTimetable, setHasTimetable] = useState<boolean>(false);
  const [toasts, setToasts] = useState<{ key: string; text: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const doUpload = async (file: File) => {
    setUploadMsg('');
    const fd = new FormData();
    fd.append('file', file);
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headerToken = token || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : '');
    if (!headerToken) {
      setUploadMsg('Please log in before uploading your timetable.');
      return;
    }
    try {
      setUploading(true);
      const resp = await fetch(`${API}/timetable/upload`, { method: 'POST', headers: { Authorization: `Bearer ${headerToken}` }, body: fd });
      const maybeJson = await resp.json().catch(()=>({}));
      if (resp.ok) {
        setUploadMsg(`Uploaded ${maybeJson.inserted ?? ''} entries. Refreshing...`);
        await load();
      } else {
        setUploadMsg(`Upload failed: ${maybeJson.detail || resp.statusText || 'Unknown error'}`);
      }
    } catch (err:any) {
      setUploadMsg(`Upload error: ${err?.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await studentAPI.getTimetable();
      const tt = (data && data.timetable) ? data.timetable : {};
      setSchedule(tt);
      setSource(data?.source || '');
      // also check if a timetable exists
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const headerToken = token || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : '');
      if (headerToken) {
        const ex = await fetch(`${API}/timetable/exists`, { headers: { Authorization: `Bearer ${headerToken}` } });
        const ej = await ex.json().catch(()=>({has_timetable:false}));
        setHasTimetable(!!ej?.has_timetable);
      }
    } catch (e:any) {
      setError(e?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); }, []);

  // Poll upcoming classes and show a lightweight toast
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headerToken = token || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : '');
    if (!headerToken) return;

    let timer: any;
    const poll = async () => {
      try {
        const resp = await fetch(`${API}/timetable/upcoming?window=10`, { headers: { Authorization: `Bearer ${headerToken}` } });
        const data = await resp.json().catch(()=>({upcoming:[]}));
        const items: any[] = Array.isArray(data.upcoming) ? data.upcoming : [];
        items.forEach((it) => {
          const k = `ttn_${new Date().toDateString()}_${it.key}`;
          if (typeof window !== 'undefined' && !localStorage.getItem(k)) {
            localStorage.setItem(k, '1');
            const text = `Upcoming class in ${it.minutes_until} min: ${it.subject || 'Class'} (${it.start_time})`;
            setToasts((prev) => [...prev, { key: k, text }]);
          }
        });
      } catch {
        // ignore polling errors
      }
      timer = setTimeout(poll, 60_000);
    };
    poll();
    return () => { if (timer) clearTimeout(timer); };
  }, [token]);

  const allTimes = useMemo(()=>{
    const times = new Set<string>();
    for (const d of Object.keys(schedule||{})) {
      (schedule[d]||[]).forEach((entry:any)=>{ if (entry.time) times.add(entry.time); });
    }
    // Sort by parsed start minutes, fallback to lexical
    return Array.from(times).sort((a,b)=>{
      const da = parseStartMinutes(a); const db = parseStartMinutes(b);
      if (da !== db) return da - db;
      return a.localeCompare(b);
    });
  }, [schedule]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="timetable" />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">My Timetable</h1>
          
          <div className="space-y-6">
            {/* Upload personal timetable (image/pdf) */}
            {!hasTimetable ? (
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Upload Your Timetable</h3>
                <p className="text-gray-300 text-sm mb-3">Upload an image or PDF of your timetable. We’ll OCR it and show your personal schedule. This overrides the default course timetable for you.</p>
                <input ref={fileRef} id="tt-file" type="file" accept="image/*,application/pdf" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPickedName(f.name);
                  await doUpload(f);
                  // reset value so selecting the same file again still triggers change
                  e.currentTarget.value = '';
                }} />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm">{uploading ? 'Uploading…' : 'Upload'}</button>
                  <button type="button" onClick={load} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">Refresh</button>
                  {source && <span className="text-xs text-gray-400">source: {source}</span>}
                  {pickedName && <span className="text-xs text-gray-400">selected: {pickedName}</span>}
                </div>
                {uploadMsg && <div className="mt-2 text-sm text-gray-300">{uploadMsg}</div>}
              </div>
            ) : (
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Your timetable is set</h3>
                    <p className="text-gray-400 text-sm">We won't prompt you to upload again. You can replace it anytime.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Replace timetable</button>
                    <button type="button" onClick={load} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">Refresh</button>
                  </div>
                </div>
                <input ref={fileRef} id="tt-file" type="file" accept="image/*,application/pdf" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPickedName(f.name);
                  await doUpload(f);
                  e.currentTarget.value = '';
                }} />
                {uploadMsg && <div className="mt-2 text-sm text-gray-300">{uploadMsg}</div>}
              </div>
            )}

            {/* Weekly Timetable (dynamic) */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              {loading ? (
                <div className="text-gray-300">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-gray-300 p-3 font-medium">Time</th>
                      {daysOrder.map(d=> (
                        <th key={d} className="text-center text-gray-300 p-3 font-medium">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTimes.length === 0 ? (
                      <tr><td colSpan={8} className="p-4 text-gray-400">No timetable entries. Upload your timetable above.</td></tr>
                    ) : (
                      allTimes.map((t)=> (
                        <tr key={t} className="border-b border-white/5">
<td className="p-3 text-gray-400 font-medium whitespace-nowrap">{formatRangeAmPm(t)}</td>
                          {daysOrder.map((d)=>{
                            const rowRange = t;
                            const entries = (schedule[d]||[]).filter((e:any)=> e.time && rangesOverlap(e.time, rowRange));
                            const e = entries[0];
                            return (
                              <td key={d} className="p-2 align-top">
                                {!e ? (
                                  <div className="bg-gray-500/10 border border-white/5 rounded-lg p-3 text-center">
                                    <div className="text-xs text-gray-500">—</div>
                                  </div>
                                ) : (
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                                    <div className="text-sm font-medium text-white">{e.subject || 'Class'}</div>
                                    <div className="text-xs text-gray-300 mt-1">
                                      {(e.faculty || e.instructor) ? <span>{e.faculty || e.instructor}</span> : null}
                                      {(e.faculty || e.instructor) && e.room ? <span> • </span> : null}
                                      {e.room ? <span>{e.room}</span> : null}
                                    </div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}

                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toasts for upcoming classes */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div key={t.key} className="bg-blue-600 text-white px-4 py-2 rounded shadow">
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentTimetable;
