'use client';

import { useState } from 'react';
import QRScanner from '@/components/QRScanner';

export default function ExitPage() {
  const [stage, setStage] = useState<'scan' | 'confirm' | 'success'>('scan');
  const [exitData, setExitData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async (riderId: string) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/exit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rider_id: riderId }),
      });

      const data = await response.json();

      if (response.ok) {
        setExitData(data);
        setStage('confirm');
      } else {
        setError(data.error || 'Exit calculation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/exit/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: exitData.session_id,
          amount: exitData.amount,
          duration_minutes: exitData.duration_minutes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStage('success');
      } else {
        setError(data.error || 'Payment confirmation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setStage('scan');
    setExitData(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vehicle Exit</h1>
        <p className="text-gray-600">Scan rider QR code to calculate payment</p>
      </div>

      {stage === 'scan' && !error && <QRScanner onScan={handleScan} />}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Processing...</p>
        </div>
      )}

      {stage === 'confirm' && exitData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Payment Due</h2>
          </div>

          <div className="bg-white rounded-lg p-6 space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle Number:</span>
              <span className="font-bold text-gray-900">{exitData.vehicle_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rider Name:</span>
              <span className="font-bold text-gray-900">{exitData.rider_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Entry Time:</span>
              <span className="font-medium text-gray-900">
                {new Date(exitData.entry_time).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Exit Time:</span>
              <span className="font-medium text-gray-900">
                {new Date(exitData.exit_time).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-600">Duration:</span>
              <span className="font-bold text-gray-900">{exitData.duration_minutes} minutes</span>
            </div>
            <div className="flex justify-between bg-purple-50 p-4 rounded-lg">
              <span className="text-lg font-semibold text-purple-900">Amount to Pay:</span>
              <span className="text-3xl font-bold text-purple-600">₹{exitData.amount}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={resetScan}
              className="order-2 md:order-1 flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="order-1 md:order-2 flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
            >
              Confirm Payment
            </button>
          </div>
        </div>
      )}

      {stage === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Confirmed!</h2>
            <p className="text-green-600">Exit recorded successfully</p>
          </div>

          <div className="bg-white rounded-lg p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Receipt</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">{exitData.vehicle_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{exitData.duration_minutes} minutes</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Amount Paid:</span>
                <span className="font-bold text-green-600">₹{exitData.amount}</span>
              </div>
            </div>
          </div>

          <button
            onClick={resetScan}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Scan Next Vehicle
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
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
