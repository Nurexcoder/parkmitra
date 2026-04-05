'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import RiderForm from '@/components/RiderForm';

export default function EditRiderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRider = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/riders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setRider(data.rider);
        } else {
          setError(data.error || 'Failed to fetch rider');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchRider();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl max-w-2xl mx-auto mt-8">
        <h3 className="text-xl font-bold mb-2">Error</h3>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => router.push('/riders')}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Back to Riders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/riders')}
          className="text-gray-600 hover:text-purple-600 mb-4 flex items-center gap-1 transition-colors"
        >
          ← Back to Riders
        </button>
      </div>
      <RiderForm initialData={rider} isEdit={true} />
    </div>
  );
}
