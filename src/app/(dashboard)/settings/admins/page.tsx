'use client';

import { useEffect, useState } from 'react';

interface AdminUser { _id: string; name: string; email: string; createdAt: string; }

const inputCls = "w-full bg-[#1a1a1a] border border-white/10 text-zinc-200 placeholder-zinc-600 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/admins', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setAdmins(data.admins); }
    } catch { console.error('Failed to fetch admins'); }
    finally { setLoading(false); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) { setSuccess('Admin created successfully'); setFormData({ name: '', email: '', password: '' }); setShowForm(false); fetchAdmins(); }
      else setError(data.error || 'Failed to create admin');
    } catch { setError('Network error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Admins</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Invite and manage system administrators</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`text-sm font-medium py-2 px-4 rounded-lg transition-colors ${showForm ? 'bg-white/8 hover:bg-white/12 text-zinc-300' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
        >
          {showForm ? 'Cancel' : '+ Invite Admin'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#161616] border border-white/8 rounded-xl p-5">
          <p className="text-sm font-medium text-zinc-200 mb-4">Invite New Admin</p>
          <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} />
            <input type="email" placeholder="Email Address" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
            <input type="password" placeholder="Secure Password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputCls} />
            <div className="md:col-span-3 flex items-center gap-3">
              <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
                Create Admin Account
              </button>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          </form>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                {['Name', 'Email', 'Joined'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-zinc-600 text-sm">Loading…</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-zinc-600 text-sm">No other admins found.</td></tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-zinc-200">{admin.name}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{admin.email}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">{new Date(admin.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
