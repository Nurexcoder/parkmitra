'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import QRScanner from '@/components/QRScanner';
import PlateScanner from '@/components/PlateScanner';

type Stage = 'scan' | 'confirm' | 'upi' | 'success';
type UpiStatus = 'pending' | 'cancelled' | 'expired';
type Tab = 'qr' | 'plate';

interface ExitData {
  session_id: string;
  rider_name: string;
  vehicle_number: string;
  entry_time: string;
  exit_time: string;
  duration_minutes: number;
  amount: number;
}

interface UpiData {
  link_id: string;
  payment_url: string;
  qr_data_url: string;
}

export default function ExitPage() {
  const [tab, setTab] = useState<Tab>('qr');
  const [stage, setStage] = useState<Stage>('scan');
  const [exitData, setExitData] = useState<ExitData | null>(null);
  const [upiData, setUpiData] = useState<UpiData | null>(null);
  const [upiStatus, setUpiStatus] = useState<UpiStatus>('pending');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const token = () => localStorage.getItem('token');

  const fetchExit = async (url: string, body: object) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) { setExitData(data); setStage('confirm'); }
      else setError(data.error || 'Exit calculation failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (riderId: string) => fetchExit('/api/exit', { rider_id: riderId });
  const handlePlateScan = (plate: string) => fetchExit('/api/exit/plate', { plate_number: plate });

  const handleCashPayment = async () => {
    if (!exitData) return;
    setLoading(true);
    setPaymentMethod('cash');
    try {
      const res = await fetch('/api/exit/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          session_id: exitData.session_id,
          amount: exitData.amount,
          duration_minutes: exitData.duration_minutes,
          payment_method: 'cash',
        }),
      });
      const data = await res.json();
      if (res.ok) setStage('success');
      else setError(data.error || 'Payment confirmation failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createUpiLink = async (exit: ExitData) => {
    setLoading(true);
    setUpiStatus('pending');
    try {
      const res = await fetch('/api/payment/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          session_id: exit.session_id,
          amount: exit.amount,
          vehicle_number: exit.vehicle_number,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create payment link'); return; }

      const qrDataUrl = await QRCode.toDataURL(data.payment_url, { width: 240, margin: 2 });
      setUpiData({ link_id: data.link_id, payment_url: data.payment_url, qr_data_url: qrDataUrl });
      setStage('upi');
      startPolling(data.link_id, exit);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiPayment = async () => {
    if (!exitData) return;
    setPaymentMethod('upi');
    await createUpiLink(exitData);
  };

  const handleUpiRetry = async () => {
    if (!exitData) return;
    await createUpiLink(exitData);
  };

  const startPolling = (linkId: string, exit: ExitData) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status/${linkId}`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        const data = await res.json();
        if (data.status === 'paid') {
          clearInterval(pollRef.current!);
          await confirmUpiPayment(linkId, exit);
        } else if (data.status === 'cancelled' || data.status === 'expired') {
          clearInterval(pollRef.current!);
          setUpiStatus(data.status === 'cancelled' ? 'cancelled' : 'expired');
        }
      } catch {
        // Silently retry on network errors
      }
    }, 3000);
  };

  const confirmUpiPayment = async (linkId: string, exit: ExitData) => {
    try {
      const res = await fetch('/api/exit/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          session_id: exit.session_id,
          amount: exit.amount,
          duration_minutes: exit.duration_minutes,
          payment_method: 'upi',
          razorpay_payment_link_id: linkId,
        }),
      });
      const data = await res.json();
      if (res.ok) setStage('success');
      else setError(data.error || 'Failed to confirm UPI payment');
    } catch {
      setError('Network error confirming payment.');
    }
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setTab('qr');
    setStage('scan');
    setExitData(null);
    setUpiData(null);
    setUpiStatus('pending');
    setPaymentMethod(null);
    setError('');
  };

  const goBack = () => {
    if (stage === 'upi') {
      // Stop polling, go back to confirm — rider can switch to cash
      if (pollRef.current) clearInterval(pollRef.current);
      setUpiData(null);
      setUpiStatus('pending');
      setPaymentMethod(null);
      setError('');
      setStage('confirm');
    } else {
      reset();
    }
  };

  const fmtTime = (t: string) =>
    new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const fmtDuration = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Vehicle Exit</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Scan QR code or number plate to calculate and confirm payment</p>
      </div>

      <div className="grid md:grid-cols-5 gap-5">
        {/* Left: Camera / Status */}
        <div className="md:col-span-3">
          <div className="bg-[#161616] border border-white/8 rounded-xl p-5">
            {/* Tab switcher — only visible while scanning */}
            {stage === 'scan' && (
              <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-4">
                {(['qr', 'plate'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(''); }}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${tab === t ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {t === 'qr' ? 'QR Code' : 'Number Plate'}
                  </button>
                ))}
              </div>
            )}
            {stage === 'scan' && !loading ? (
              tab === 'qr'
                ? <QRScanner onScan={handleScan} />
                : <PlateScanner onDetect={handlePlateScan} />
            ) : stage === 'scan' ? null : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stage === 'success' ? 'bg-emerald-500/15' : stage === 'upi' ? 'bg-violet-500/15' : 'bg-amber-500/15'}`}>
                  {stage === 'success' ? (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : stage === 'upi' ? (
                    <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <p className="text-sm text-zinc-500">
                  {stage === 'success' ? 'Exit recorded' : stage === 'upi' ? 'Waiting for UPI payment…' : 'Choose payment method'}
                </p>
                {stage !== 'success' && (
                  <button onClick={reset} className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2">
                    Scan a different vehicle
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Payment Panel */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-48">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Processing…</p>
            </div>
          )}

          {/* Confirm stage — choose Cash or UPI */}
          {stage === 'confirm' && exitData && !loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-white/8">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Amount due</p>
                <p className="text-3xl font-bold text-amber-400">₹{exitData.amount}</p>
              </div>
              <div className="p-5 space-y-2.5">
                <Row label="Vehicle" value={exitData.vehicle_number} mono />
                <Row label="Rider" value={exitData.rider_name} />
                <Row label="Entry" value={fmtTime(exitData.entry_time)} />
                <Row label="Exit" value={fmtTime(exitData.exit_time)} />
                <Row label="Duration" value={fmtDuration(exitData.duration_minutes)} />
              </div>
              <div className="px-5 pb-5 flex flex-col gap-2">
                <button
                  onClick={handleUpiPayment}
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Pay by UPI
                </button>
                <button
                  onClick={handleCashPayment}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Collect Cash
                </button>
                <div className="flex gap-2">
                  <button onClick={goBack} className="flex-1 bg-white/5 hover:bg-white/8 text-zinc-400 text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Back
                  </button>
                  <button onClick={reset} className="flex-1 bg-white/5 hover:bg-white/8 text-red-400 text-sm font-medium py-2.5 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* UPI stage — show QR code, poll for payment */}
          {stage === 'upi' && upiData && !loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-white/8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Pay via UPI</p>
                  <p className="text-2xl font-bold text-violet-400">₹{exitData?.amount}</p>
                </div>
                {upiStatus === 'pending'
                  ? <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  : <span className={`text-xs font-medium px-2 py-1 rounded-full ${upiStatus === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {upiStatus === 'cancelled' ? 'Cancelled' : 'Expired'}
                    </span>
                }
              </div>

              {upiStatus === 'pending' ? (
                <div className="p-5 flex flex-col items-center gap-3">
                  <p className="text-xs text-zinc-500 text-center">Rider scans this QR with any UPI app</p>
                  <div className="bg-white p-2 rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={upiData.qr_data_url} alt="UPI Payment QR" width={200} height={200} />
                  </div>
                  <p className="text-xs text-zinc-600 text-center">Waiting for payment confirmation…</p>
                </div>
              ) : (
                <div className="p-5 flex flex-col items-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">
                    {upiStatus === 'cancelled' ? 'Payment was cancelled' : 'Payment link expired'}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {upiStatus === 'cancelled'
                      ? 'The rider cancelled the UPI payment. Generate a new link to try again.'
                      : 'The payment link timed out. Generate a new one to retry.'}
                  </p>
                </div>
              )}

              <div className="px-5 pb-5 flex flex-col gap-2">
                {upiStatus !== 'pending' && (
                  <button
                    onClick={handleUpiRetry}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry UPI Payment
                  </button>
                )}
                <div className="flex gap-2">
                  <button onClick={goBack} className="flex-1 bg-white/5 hover:bg-white/8 text-zinc-400 text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Back
                  </button>
                  <button onClick={reset} className="flex-1 bg-white/5 hover:bg-white/8 text-red-400 text-sm font-medium py-2.5 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success */}
          {stage === 'success' && !loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
              <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-emerald-400 font-medium text-sm">Payment confirmed</p>
                  <p className="text-zinc-500 text-xs">
                    {paymentMethod === 'upi' ? 'Paid via UPI · Exit recorded' : 'Cash collected · Exit recorded'}
                  </p>
                </div>
              </div>
              <div className="p-5 space-y-2.5">
                <Row label="Vehicle" value={exitData?.vehicle_number ?? ''} mono />
                <Row label="Duration" value={fmtDuration(exitData?.duration_minutes ?? 0)} />
                <Row label="Method" value={paymentMethod === 'upi' ? 'UPI' : 'Cash'} />
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-zinc-500">Amount paid</span>
                  <span className="text-base font-bold text-emerald-400">₹{exitData?.amount}</span>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button onClick={reset} className="w-full bg-white/8 hover:bg-white/12 text-zinc-200 text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Scan next vehicle
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-[#161616] border border-white/8 rounded-xl overflow-hidden">
              <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div>
                  <p className="text-red-400 font-medium text-sm">Error</p>
                  <p className="text-zinc-500 text-xs">{error}</p>
                </div>
              </div>
              <div className="p-5">
                <button onClick={reset} className="w-full bg-white/8 hover:bg-white/12 text-zinc-200 text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Idle instructions */}
          {stage === 'scan' && !loading && !error && (
            <div className="bg-[#161616] border border-white/8 rounded-xl p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">How exit works</p>
              <ol className="space-y-4">
                {[
                  { n: '1', text: "Scan the rider's QR code." },
                  { n: '2', text: 'Review the duration and amount due.' },
                  { n: '3', text: 'Collect cash or show UPI QR to the rider.' },
                  { n: '4', text: 'UPI payments confirm automatically.' },
                ].map(({ n, text }) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-violet-600/15 border border-violet-500/25 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                    <p className="text-zinc-500 text-sm leading-relaxed">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-semibold text-zinc-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
