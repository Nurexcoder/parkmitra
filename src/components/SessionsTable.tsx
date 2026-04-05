'use client';

import { useEffect, useState } from 'react';

interface Session {
  id: string;
  vehicle_number: string;
  rider_name: string;
  entry_time: string;
  exit_time?: string;
  duration_minutes?: number;
  amount?: number;
  status: 'INSIDE' | 'EXITED';
  payment_status: 'PENDING' | 'PAID';
}

export default function SessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const fmtTime = (s: string) =>
    new Date(s).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="bg-[#161616] border border-white/8 rounded-xl p-4 animate-pulse space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/5 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
      <div className="px-4 md:px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-200">Recent Activity</p>
        <span className="text-xs text-zinc-600">Refreshes every 30s</span>
      </div>

      {sessions.length === 0 ? (
        <p className="px-5 py-12 text-center text-zinc-600 text-sm">No parking sessions yet</p>
      ) : (
        <>
          {/* ── Mobile card list (hidden on sm+) ── */}
          <div className="sm:hidden divide-y divide-white/5">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                {/* Status dot */}
                <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${s.status === 'INSIDE' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-zinc-100">{s.vehicle_number}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      s.status === 'INSIDE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-zinc-500'
                    }`}>
                      {s.status === 'INSIDE' ? 'Inside' : 'Exited'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {s.rider_name} &middot; {fmtTime(s.entry_time)}
                    {s.duration_minutes ? ` · ${s.duration_minutes}m` : ''}
                  </p>
                </div>

                {/* Amount */}
                <span className="text-sm font-semibold text-zinc-300 shrink-0">
                  {s.amount ? `₹${s.amount}` : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* ── Desktop table (hidden below sm) ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Vehicle', 'Rider', 'Entry', 'Exit', 'Duration', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono font-medium text-zinc-200 whitespace-nowrap">{s.vehicle_number}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-400 whitespace-nowrap">{s.rider_name}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500 whitespace-nowrap">{fmtDate(s.entry_time)}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500 whitespace-nowrap">{s.exit_time ? fmtDate(s.exit_time) : '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500 whitespace-nowrap">{s.duration_minutes ? `${s.duration_minutes} min` : '—'}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-zinc-300 whitespace-nowrap">{s.amount ? `₹${s.amount}` : '—'}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        s.status === 'INSIDE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-zinc-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.status === 'INSIDE' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        {s.status === 'INSIDE' ? 'Inside' : 'Exited'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
