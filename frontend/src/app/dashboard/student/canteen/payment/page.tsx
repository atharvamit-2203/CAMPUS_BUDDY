"use client";

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { CreditCard, Check, Download } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CanteenPaymentPage() {
  const [paying, setPaying] = React.useState(false);
  const [done, setDone] = React.useState<any | null>(null);
  const amount = React.useMemo(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem('canteen_amount') || '0');
  }, []);
  const cart = React.useMemo(() => {
    if (typeof window === 'undefined') return [] as any[];
    try { return JSON.parse(localStorage.getItem('canteen_cart') || '[]'); } catch { return []; }
  }, []);

  const payNow = async () => {
    if (!cart || cart.length === 0) return;
    setPaying(true);
    try {
      const resp = await fetch(`${API}/canteen/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`
        },
        body: JSON.stringify({ items: cart, total_amount: amount, payment_method: 'pay_now', payment_status: 'paid' })
      });
      if (!resp.ok) throw new Error('Payment failed');
      const data = await resp.json();
      setDone(data);
      // Auto download QR
      const link = document.createElement('a');
      link.href = data.qr_url;
      link.download = `canteen_order_${data.order_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // cleanup cart
      localStorage.removeItem('canteen_cart');
      localStorage.removeItem('canteen_amount');
    } catch (e) {
      console.error(e);
      alert('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="canteen" />
      <div className="flex-1 p-8">
        <div className="max-w-xl mx-auto bg-black/40 border border-white/10 rounded-xl p-6 text-gray-200">
          <h1 className="text-2xl font-bold text-white mb-4">Canteen Payment</h1>
          <div className="mb-6">You are paying <span className="text-white font-semibold">₹{amount}</span> for your canteen order.</div>

          {done ? (
            <div className="space-y-4">
              <div className="flex items-center text-green-400"><Check className="w-5 h-5 mr-2"/> Payment successful</div>
              <div className="text-sm">Order ID: <span className="text-white">{done.order_id}</span></div>
              <div className="text-sm">Show this QR at pickup:</div>
              <img src={done.qr_url} alt="QR" className="w-40 h-40 border border-white/10 rounded" />
              <a href={done.qr_url} download={`canteen_order_${done.order_id}.png`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white">
                <Download className="w-4 h-4"/> Download QR
              </a>
              <div>
                <a href="/dashboard/student/canteen" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">Back to Canteen</a>
              </div>
            </div>
          ) : (
            <button onClick={payNow} disabled={paying} className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded">
              <CreditCard className="w-5 h-5"/>
              {paying ? 'Processing...' : 'Pay Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}