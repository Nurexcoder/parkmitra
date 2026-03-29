'use client';

import { useState } from 'react';
import QRScanner from '@/components/QRScanner';

export default function EntryPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async (riderId: string) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rider_id: riderId }),
      });
      const data = await response.json();
      if (response.ok) setResult(data);
      else setError(data.error || 'Entry failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(''); };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Vehicle Entry</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Scan the rider's QR code to record their entry</p>
      </div>

      <div className="grid md:grid-cols-5 gap-5">
        <div className="md:col-span-3">
          <div className="bg-[#161616] border border-white/8 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Camera</p>
            <QRScanner onScan={handleScan} />
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          {loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-48">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Recording entry…</p>
            </div>
          )}

          {result && !loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
              <div className="bg-emerald-500/15 border-b border-emerald-500/20 px-5 py-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-emerald-400 font-medium text-sm">Entry recorded</p>
                  <p className="text-zinc-500 text-xs">{result.message}</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <Row label="Vehicle" value={result.session.vehicle_number} mono />
                <Row label="Rider" value={result.session.rider_name} />
                <Row label="Entry time" value={new Date(result.session.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} />
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
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-red-400 font-medium text-sm">Entry failed</p>
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

          {!loading && !result && !error && (
            <div className="bg-[#161616] border border-white/8 rounded-xl p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Instructions</p>
              <ol className="space-y-4">
                {[
                  { n: '1', text: 'Press "Start Scanning" to open the camera.' },
                  { n: '2', text: "Hold the rider's QR code in front of the camera." },
                  { n: '3', text: 'Entry is recorded automatically once the code is detected.' },
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
