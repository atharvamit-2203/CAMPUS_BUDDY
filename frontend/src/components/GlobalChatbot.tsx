'use client';

import React from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ChatMsg { id: number; text: string; isBot: boolean; time: Date; }

export default function GlobalChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [msgs, setMsgs] = React.useState<ChatMsg[]>([
    { id: 1, text: "Hi! I’m your CampusConnect assistant. How can I help you today?", isBot: true, time: new Date() }
  ]);

  const send = async () => {
    const txt = input.trim();
    if (!txt) return;
    const nextId = msgs.length + 1;
    setMsgs(prev => [...prev, { id: nextId, text: txt, isBot: false, time: new Date() }]);
    setInput('');
    setBusy(true);
    try {
      const resp = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`
        },
        body: JSON.stringify({ message: txt })
      });
      const data = await resp.json();
      const ans = data?.answer || 'Sorry, I could not process that.';
      setMsgs(prev => [...prev, { id: nextId + 1, text: ans, isBot: true, time: new Date() }]);
    } catch (e) {
      setMsgs(prev => [...prev, { id: nextId + 1, text: 'Network error. Please try again.', isBot: true, time: new Date() }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button onClick={()=>setOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-2xl flex items-center justify-center z-50">
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col z-50">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-white font-semibold">CampusConnect Assistant</div>
            <button onClick={()=>setOpen(false)} className="text-gray-300 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {msgs.map(m => (
              <div key={m.id} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.isBot ? 'bg-white/10 text-gray-100 rounded-bl-md' : 'bg-blue-600 text-white rounded-br-md'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type a message..." className="flex-1 bg-white/10 text-white px-3 py-2 rounded-md outline-none"/>
              <button onClick={send} disabled={busy} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-flex items-center gap-1">
                <Send className="w-4 h-4"/> {busy ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}