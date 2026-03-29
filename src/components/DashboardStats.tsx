'use client';

import { useEffect, useState } from 'react';

interface Stats {
  vehicles_inside: number;
  total_today: number;
  revenue_today: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#161616] border border-white/8 rounded-xl p-5 animate-pulse">
            <div className="h-3 bg-white/8 rounded w-1/2 mb-4" />
            <div className="h-8 bg-white/8 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Currently inside',
      value: stats?.vehicles_inside ?? 0,
      color: 'text-emerald-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
        </svg>
      ),
    },
    {
      label: 'Entry today',
      value: stats?.total_today ?? 0,
      color: 'text-blue-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      ),
    },
    {
      label: 'Revenue today',
      value: `₹${stats?.revenue_today ?? 0}`,
      color: 'text-amber-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(({ label, value, color, icon }) => (
        <div key={label} className="bg-[#161616] border border-white/8 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
            <span className={`${color} opacity-60`}>{icon}</span>
          </div>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
