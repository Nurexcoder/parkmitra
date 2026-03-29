'use client';

import { useState } from 'react';

const inputCls = "w-full bg-[#1a1a1a] border border-white/10 text-zinc-200 placeholder-zinc-600 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors";
const labelCls = "block text-xs font-medium text-zinc-400 mb-1.5";

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (formData.newPassword !== formData.confirmPassword) { setMessage({ type: 'error', text: 'New passwords do not match' }); return; }
    if (formData.newPassword.length < 6) { setMessage({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: formData.currentPassword, newPassword: formData.newPassword }),
      });
      const data = await response.json();
      if (response.ok) { setMessage({ type: 'success', text: 'Password changed successfully!' }); setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
      else setMessage({ type: 'error', text: data.error || 'Failed to change password' });
    } catch { setMessage({ type: 'error', text: 'Network error. Please try again.' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Security</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Update your administrator password</p>
      </div>

      <div className="bg-[#161616] border border-white/8 rounded-xl p-6">
        {message && (
          <div className={`mb-5 text-sm px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Current Password</label>
            <input type="password" required value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} className={inputCls} placeholder="••••••••" />
          </div>

          <div className="border-t border-white/8 pt-4">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>New Password</label>
                <input type="password" required value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className={inputCls} placeholder="••••••••" />
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className={inputCls} placeholder="••••••••" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors mt-2">
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
