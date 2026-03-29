'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('admin', JSON.stringify(data.admin));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4">P</div>
          <h1 className="text-xl font-semibold text-zinc-100">ParkMitra</h1>
          <p className="text-zinc-500 text-sm mt-1">Admin dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-white/8 rounded-xl p-6">
          <p className="text-sm font-medium text-zinc-300 mb-5">Sign in to your account</p>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-white/10 text-zinc-200 placeholder-zinc-600 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                placeholder="admin@parkmitra.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-white/10 text-zinc-200 placeholder-zinc-600 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-600 font-mono">
            admin@parkmitra.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
