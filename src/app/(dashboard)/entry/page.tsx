'use client';

import { useState } from 'react';
import QRScanner from '@/components/QRScanner';

export default function EntryPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async (riderId: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rider_id: riderId }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Entry failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vehicle Entry</h1>
        <p className="text-gray-600">Scan rider QR code to record entry</p>
      </div>

      {!result && !error && <QRScanner onScan={handleScan} />}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Processing entry...</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Entry Recorded!</h2>
            <p className="text-green-600">{result.message}</p>
          </div>

          <div className="bg-white rounded-lg p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle Number:</span>
              <span className="font-bold text-gray-900">{result.session.vehicle_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rider Name:</span>
              <span className="font-bold text-gray-900">{result.session.rider_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Entry Time:</span>
              <span className="font-bold text-gray-900">
                {new Date(result.session.entry_time).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={resetScan}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Scan Next Vehicle
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Entry Failed</h2>
            <p className="text-red-600">{error}</p>
          </div>

          <button
            onClick={resetScan}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-all shadow-lg"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
