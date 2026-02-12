'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Rider {
  _id: string;
  name: string;
  phone: string;
  vehicle_number: string;
  created_at: string;
  qr_code?: string;
}

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, [search]);

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = search ? `/api/riders?search=${encodeURIComponent(search)}` : '/api/riders';
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRiders(data.riders);
      }
    } catch (error) {
      console.error('Failed to fetch riders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Riders</h1>
          <p className="text-gray-600">Manage rider profiles and QR codes</p>
        </div>
        <Link
          href="/riders/new"
          className="w-full md:w-auto text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
        >
          + Add New Rider
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <input
          type="text"
          placeholder="Search by vehicle number, name, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">Vehicle Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {riders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {search ? 'No riders found matching your search' : 'No riders yet. Add your first rider!'}
                    </td>
                  </tr>
                ) : (
                  riders.map((rider) => (
                    <tr key={rider._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{rider.vehicle_number}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{rider.name}</td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{rider.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(rider.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         {rider.qr_code && (
                           <button
                             onClick={() => {
                               const win = window.open();
                               win?.document.write(`<img src="${rider.qr_code}" style="width:100%;max-width:300px;">`);
                             }}
                             className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                           >
                             View QR
                           </button>
                         )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
