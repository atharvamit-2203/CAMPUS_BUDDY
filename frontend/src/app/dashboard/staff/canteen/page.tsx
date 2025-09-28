'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CanteenStaffPage() {
  const [queued, setQueued] = React.useState<any[]>([]);
  const [preparing, setPreparing] = React.useState<any[]>([]);
  const [ready, setReady] = React.useState<any[]>([]);
  const [scanToken, setScanToken] = React.useState('');
  const [msg, setMsg] = React.useState('');

  const load = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
    const fetchStatus = async (s:string) => {
      const r = await fetch(`${API}/canteen/orders?status=${s}`, { headers: { Authorization: `Bearer ${token}` }});
      return r.json();
    };
    setQueued(await fetchStatus('queued'));
    setPreparing(await fetchStatus('preparing'));
    setReady(await fetchStatus('ready'));
  };

  React.useEffect(()=>{ load(); }, []);

  const setStatus = async (id:number, status:string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
    await fetch(`${API}/canteen/orders/${id}/status`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
    await load();
  };

  const scan = async () => {
    setMsg('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
    const resp = await fetch(`${API}/canteen/scan`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ qr_token: scanToken })});
    const data = await resp.json();
    setMsg(data.message || (data.valid ? 'Verified' : 'Invalid'));
    await load();
  };

  const Section = ({title, items, next}:{title:string, items:any[], next:string}) => (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
      <div className="text-white font-semibold mb-3">{title} ({items.length})</div>
      <div className="space-y-2">
        {items.map(o => (
          <div key={o.id} className="flex items-center justify-between bg-white/5 rounded p-2">
            <div className="text-gray-200">Order #{o.id} — ₹{o.total_amount} — {new Date(o.created_at).toLocaleString()}</div>
            <button onClick={()=>setStatus(o.id, next)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Mark {next}</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/staff/canteen" />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Canteen Staff</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Section title="Queued" items={queued} next="preparing" />
          <Section title="Preparing" items={preparing} next="ready" />
          <Section title="Ready" items={ready} next="served" />
        </div>
        <div className="mt-6 bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="text-white font-semibold mb-2">Scan QR Token</div>
          <div className="flex gap-2">
            <input value={scanToken} onChange={e=>setScanToken(e.target.value)} placeholder="Paste qr_token here" className="flex-1 bg-white/10 text-white px-3 py-2 rounded"/>
            <button onClick={scan} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Verify</button>
          </div>
          {msg && <div className="text-gray-300 mt-2">{msg}</div>}
        </div>
      </div>
    </div>
  );
}