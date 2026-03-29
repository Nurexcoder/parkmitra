'use client';

import { useState } from 'react';
import QRScanner from '@/components/QRScanner';

export default function ExitPage() {
  const [stage, setStage] = useState<'scan' | 'confirm' | 'success'>('scan');
  const [exitData, setExitData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async (riderId: string) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rider_id: riderId }),
      });
      const data = await response.json();
      if (response.ok) { setExitData(data); setStage('confirm'); }
      else setError(data.error || 'Exit calculation failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/exit/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: exitData.session_id, amount: exitData.amount, duration_minutes: exitData.duration_minutes }),
      });
      const data = await response.json();
      if (response.ok) setStage('success');
      else setError(data.error || 'Payment confirmation failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStage('scan'); setExitData(null); setError(''); };

  const fmtTime = (t: string) => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const fmtDuration = (m: number) => { const h = Math.floor(m / 60); const min = m % 60; return h > 0 ? `${h}h ${min}m` : `${min}m`; };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Vehicle Exit</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Scan the rider's QR code to calculate and confirm payment</p>
      </div>

      <div className="grid md:grid-cols-5 gap-5">
        <div className="md:col-span-3">
          <div className="bg-[#161616] border border-white/8 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Camera</p>
            {stage === 'scan' ? (
              <QRScanner onScan={handleScan} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stage === 'success' ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
                  {stage === 'success'
                    ? <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    : <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  }
                </div>
                <p className="text-sm text-zinc-500">{stage === 'success' ? 'Exit recorded' : 'Confirm payment to proceed'}</p>
                {stage !== 'success' && (
                  <button onClick={reset} className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2">
                    Scan a different vehicle
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          {loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-48">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Processing…</p>
            </div>
          )}

          {stage === 'confirm' && exitData && !loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-white/8">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Amount due</p>
                <p className="text-3xl font-bold text-amber-400">₹{exitData.amount}</p>
              </div>
              <div className="p-5 space-y-2.5">
                <Row label="Vehicle" value={exitData.vehicle_number} mono />
                <Row label="Rider" value={exitData.rider_name} />
                <Row label="Entry" value={fmtTime(exitData.entry_time)} />
                <Row label="Exit" value={fmtTime(exitData.exit_time)} />
                <Row label="Duration" value={fmtDuration(exitData.duration_minutes)} />
              </div>
              <div className="px-5 pb-5 flex flex-col gap-2">
                <button onClick={handleConfirmPayment} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Confirm payment
                </button>
                <button onClick={reset} className="w-full bg-white/5 hover:bg-white/8 text-zinc-400 text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === 'success' && !loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
              <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                  <p className="text-emerald-400 font-medium text-sm">Payment confirmed</p>
                  <p className="text-zinc-500 text-xs">Exit recorded successfully</p>
                </div>
              </div>
              <div className="p-5 space-y-2.5">
                <Row label="Vehicle" value={exitData.vehicle_number} mono />
                <Row label="Duration" value={fmtDuration(exitData.duration_minutes)} />
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-zinc-500">Amount paid</span>
                  <span className="text-base font-bold text-emerald-400">₹{exitData.amount}</span>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button onClick={reset} className="w-full bg-white/8 hover:bg-white/12 text-zinc-200 text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Scan next vehicle
                </button>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
              <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
                <div>
                  <p className="text-red-400 font-medium text-sm">Error</p>
                  <p className="text-zinc-500 text-xs">{error}</p>
                </div>
              </div>
              <div className="p-5">
                <button onClick={reset} className="w-full bg-white/8 hover:bg-white/12 text-zinc-200 text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Try again
                </button>
              </div>
            </div>
          )}

          {stage === 'scan' && !loading && !error && (
            <div className="bg-[#161616] border border-white/8 rounded-xl p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">How exit works</p>
              <ol className="space-y-4">
                {[
                  { n: '1', text: "Scan the rider's QR code." },
                  { n: '2', text: 'Review the duration and amount due.' },
                  { n: '3', text: 'Collect payment and press "Confirm".' },
                ].map(({ n, text }) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-violet-600/15 border border-violet-500/25 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                    <p className="text-zinc-500 text-sm leading-relaxed">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-semibold text-zinc-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
