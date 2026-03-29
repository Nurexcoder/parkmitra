'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Rider {
  _id: string;
  name: string;
  phone: string;
  vehicle_number: string;
  created_at: string;
  qr_code?: string;
  email?: string;
}

export default function RidersPage() {
  const router = useRouter();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchRiders(); }, [search]);

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = search ? `/api/riders?search=${encodeURIComponent(search)}` : '/api/riders';
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setRiders(data.riders); }
    } catch (error) {
      console.error('Failed to fetch riders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/riders/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { setRiders(riders.filter(r => r._id !== id)); setDeleteConfirm(null); }
      else alert('Failed to delete rider');
    } catch { alert('Network error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Riders</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Manage rider profiles and QR codes</p>
        </div>
        <Link
          href="/riders/new"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Rider
        </Link>
      </div>

      {/* Search */}
      <div className="bg-[#161616] border border-white/8 rounded-xl p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by vehicle number, name, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/8 text-zinc-200 placeholder-zinc-600 text-sm pl-9 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-[#161616] border border-white/8 rounded-xl p-5 space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-white/5 rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/8">
                  {['Vehicle Number', 'Name', 'Phone', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-zinc-600 text-sm">
                      {search ? 'No riders match your search' : 'No riders yet. Add your first rider!'}
                    </td>
                  </tr>
                ) : (
                  riders.map((rider) => (
                    <tr key={rider._id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-sm font-medium text-zinc-200 whitespace-nowrap">{rider.vehicle_number}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-400 whitespace-nowrap">{rider.name}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-500 whitespace-nowrap">{rider.phone}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 whitespace-nowrap">{new Date(rider.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {rider.qr_code && (
                            <button
                              onClick={() => { const w = window.open(); w?.document.write(`<img src="${rider.qr_code}" style="width:300px;">`); }}
                              className="p-1.5 text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                              title="View QR"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/riders/edit/${rider._id}`)}
                            className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(rider._id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161616] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-semibold text-zinc-100 mb-2">Delete rider?</h3>
            <p className="text-zinc-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-white/8 hover:bg-white/12 text-zinc-300 text-sm py-2.5 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm py-2.5 rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
