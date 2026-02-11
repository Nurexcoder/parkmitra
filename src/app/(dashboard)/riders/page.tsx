'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Rider {
  _id: string;
  name: string;
  phone: string;
  vehicle_number: string;
  created_at: string;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Riders</h1>
          <p className="text-gray-600">Manage rider profiles and QR codes</p>
        </div>
        <Link
          href="/riders/new"
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
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
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Vehicle Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {riders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      {search ? 'No riders found matching your search' : 'No riders yet. Add your first rider!'}
                    </td>
                  </tr>
                ) : (
                  riders.map((rider) => (
                    <tr key={rider._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{rider.vehicle_number}</td>
                      <td className="px-6 py-4 text-gray-700">{rider.name}</td>
                      <td className="px-6 py-4 text-gray-600">{rider.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(rider.created_at).toLocaleDateString('en-IN')}
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
