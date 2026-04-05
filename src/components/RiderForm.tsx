'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlateScanner from '@/components/PlateScanner';

interface RiderFormProps {
  initialData?: { _id: string; name: string; phone: string; vehicle_number: string; email: string; };
  isEdit?: boolean;
}

const inputCls = "w-full bg-[#1a1a1a] border border-white/10 text-zinc-200 placeholder-zinc-600 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors";
const labelCls = "block text-xs font-medium text-zinc-400 mb-1.5";

export default function RiderForm({ initialData, isEdit = false }: RiderFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', phone: '', vehicle_number: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (initialData) setFormData({ name: initialData.name, phone: initialData.phone, vehicle_number: initialData.vehicle_number, email: initialData.email || '' });
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const url = isEdit ? `/api/riders/${initialData?._id}` : '/api/riders';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || `Rider ${isEdit ? 'updated' : 'created'} successfully!` });
        if (!isEdit) setFormData({ name: '', phone: '', vehicle_number: '', email: '' });
        else setTimeout(() => router.push('/riders'), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || `Failed to ${isEdit ? 'update' : 'create'} rider` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#161616] border border-white/8 rounded-xl p-6 max-w-2xl">
      <h2 className="text-base font-semibold text-zinc-100 mb-6">{isEdit ? 'Edit Rider' : 'Add New Rider'}</h2>

      {message && (
        <div className={`mb-5 flex items-start gap-2.5 text-sm px-4 py-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className={labelCls}>Name <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="Enter rider name" />
        </div>
        <div>
          <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
          <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} placeholder="Enter phone number" />
        </div>

        {/* Vehicle number with plate scan option */}
        <div className="md:col-span-2">
          <label className={labelCls}>Vehicle Number <span className="text-red-500">*</span></label>
          {showScanner ? (
            <div className="mt-1">
              <PlateScanner
                onDetect={(plate) => {
                  setFormData((f) => ({ ...f, vehicle_number: plate }));
                  setShowScanner(false);
                }}
                onCancel={() => setShowScanner(false)}
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                className={`${inputCls} uppercase flex-1`}
                placeholder="WB 01 AB 1234"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                title="Scan plate with camera"
                className="shrink-0 px-3 bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-zinc-400 hover:text-violet-400 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>Email <span className="text-red-500">*</span></label>
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="rider@example.com" />
        </div>
      </div>

      <div className="flex gap-3">
        {isEdit && (
          <button type="button" onClick={() => router.push('/riders')} className="flex-1 bg-white/8 hover:bg-white/12 text-zinc-300 text-sm py-2.5 rounded-lg transition-colors">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
          {loading ? 'Processing…' : isEdit ? 'Update Rider' : 'Create Rider & Send QR'}
        </button>
      </div>
    </form>
  );
}
