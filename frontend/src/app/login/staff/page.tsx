"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // After login, navigate to staff dashboard
      router.push('/dashboard/staff/canteen');
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      if (/unauthorized|incorrect email or password|401/i.test(msg)) setError('Invalid email or password.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-2xl p-8">
        <h1 className="text-white text-2xl font-bold mb-6">Canteen Staff Login</h1>
        {error && <div className="mb-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-1">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" className="w-full bg-black/40 text-white border border-white/20 rounded px-3 py-2" required />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-1">Password</label>
            <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className="w-full bg-black/40 text-white border border-white/20 rounded px-3 py-2" required />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 disabled:opacity-50">{loading? 'Signing in...' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
