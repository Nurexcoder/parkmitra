'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface RiderFormProps {
  initialData?: { _id: string; name: string; phone: string; vehicle_number: string; email: string; image_key?: string };
  isEdit?: boolean;
}

type OcrStatus = 'idle' | 'uploading' | 'scanning' | 'done' | 'failed';
type CameraState = 'closed' | 'open';

const inputCls = "w-full bg-[#1a1a1a] border border-white/10 text-zinc-200 placeholder-zinc-600 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors";
const labelCls = "block text-xs font-medium text-zinc-400 mb-1.5";

export default function RiderForm({ initialData, isEdit = false }: RiderFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', phone: '', vehicle_number: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Camera / image state
  const [cameraState, setCameraState] = useState<CameraState>('closed');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('idle');
  const [ocrJobId, setOcrJobId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name, phone: initialData.phone, vehicle_number: initialData.vehicle_number, email: initialData.email || '' });
      if (initialData.image_key) setImageKey(initialData.image_key);
    }
  }, [initialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const startCamera = async () => {
    // Set state first so the <video> element mounts, then assign srcObject
    setCameraState('open');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      // Wait one tick for React to render the video element
      await new Promise(r => setTimeout(r, 0));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraState('closed');
      setMessage({ type: 'error', text: 'Camera access denied. Please allow camera permissions.' });
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Wait up to 2s for video to report non-zero dimensions
    let attempts = 0;
    while ((video.videoWidth === 0 || video.videoHeight === 0) && attempts < 20) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setMessage({ type: 'error', text: 'Camera not ready. Please try again.' });
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    // Resize to max 800px before upload
    const resized = document.createElement('canvas');
    const scale = Math.min(1, 800 / canvas.width);
    resized.width = canvas.width * scale;
    resized.height = canvas.height * scale;
    resized.getContext('2d')!.drawImage(canvas, 0, 0, resized.width, resized.height);

    const dataUrl = resized.toDataURL('image/jpeg', 0.85);
    setCapturedPreview(dataUrl);
    setCameraState('closed');
    stopCamera();

    // Immediately upload to R2 and queue OCR
    setOcrStatus('uploading');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ocr/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOcrStatus('failed');
        return;
      }
      setImageKey(data.imageKey);
      setOcrJobId(data.jobId);
      setOcrStatus('scanning');
      startPolling(data.jobId);
    } catch {
      setOcrStatus('failed');
    }
  }, []);

  const startPolling = (jobId: string) => {
    const deadline = Date.now() + 60_000;
    const poll = async () => {
      if (Date.now() > deadline) { setOcrStatus('failed'); return; }
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/ocr/status/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.status === 'done' && data.plate) {
          setFormData(f => ({ ...f, vehicle_number: f.vehicle_number || data.plate }));
          setOcrStatus('done');
        } else if (data.status === 'failed') {
          setOcrStatus('failed');
        } else {
          pollRef.current = setTimeout(poll, 2000);
        }
      } catch {
        pollRef.current = setTimeout(poll, 2000);
      }
    };
    pollRef.current = setTimeout(poll, 2000);
  };

  const retakePhoto = async () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    setCapturedPreview(null);
    setImageKey(null);
    setOcrStatus('idle');
    setOcrJobId(null);
    await startCamera();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.vehicle_number && !imageKey) {
      setMessage({ type: 'error', text: 'Please enter a vehicle number or capture a plate photo.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const url = isEdit ? `/api/riders/${initialData?._id}` : '/api/riders';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, image_key: imageKey }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || `Rider ${isEdit ? 'updated' : 'created'} successfully!` });
        if (!isEdit) {
          setFormData({ name: '', phone: '', vehicle_number: '', email: '' });
          setCapturedPreview(null);
          setImageKey(null);
          setOcrStatus('idle');
        } else {
          setTimeout(() => router.push('/riders'), 1500);
        }
      } else {
        setMessage({ type: 'error', text: data.error || `Failed to ${isEdit ? 'update' : 'create'} rider` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const ocrBadge = () => {
    if (ocrStatus === 'uploading') return (
      <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
        <span className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
        Uploading…
      </span>
    );
    if (ocrStatus === 'scanning') return (
      <span className="flex items-center gap-1.5 text-violet-400 text-xs">
        <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
        Reading plate…
      </span>
    );
    if (ocrStatus === 'done') return (
      <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        Plate detected
      </span>
    );
    if (ocrStatus === 'failed') return (
      <span className="text-amber-400 text-xs">Scan failed — enter plate manually</span>
    );
    return null;
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

        {/* Plate photo capture — priority field */}
        <div className="md:col-span-2">
          <label className={labelCls}>
            Plate Photo
            <span className="ml-1 text-zinc-600 font-normal">(recommended)</span>
          </label>

          {/* Camera live feed */}
          {cameraState === 'open' && (
            <div className="rounded-lg overflow-hidden bg-black aspect-video relative mb-2">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-[88%] h-[38%]">
                  <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-violet-400 rounded-tl" />
                  <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-violet-400 rounded-tr" />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-violet-400 rounded-bl" />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-violet-400 rounded-br" />
                  <span className="absolute inset-0 flex items-center justify-center text-violet-300/60 text-xs font-medium tracking-wide">Align plate here</span>
                </div>
              </div>
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
                <button type="button" onClick={capture}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Capture
                </button>
                <button type="button" onClick={() => { stopCamera(); setCameraState('closed'); }}
                  className="px-4 py-2 bg-white/8 hover:bg-white/12 text-zinc-400 text-sm rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Captured image preview */}
          {capturedPreview && cameraState === 'closed' && (
            <div className="relative rounded-lg overflow-hidden aspect-video bg-black mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedPreview} alt="Plate photo" className="w-full h-full object-cover" />
              {/* OCR scanning overlay */}
              {(ocrStatus === 'uploading' || ocrStatus === 'scanning') && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-black/70 rounded-lg px-4 py-2 flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-200 text-xs">{ocrStatus === 'uploading' ? 'Uploading…' : 'Reading plate…'}</span>
                  </div>
                </div>
              )}
              {/* Status badge + retake */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between">
                <div className="bg-black/70 rounded px-2.5 py-1">{ocrBadge()}</div>
                <button type="button" onClick={retakePhoto}
                  className="bg-black/70 hover:bg-black/90 text-zinc-300 text-xs px-2.5 py-1 rounded transition-colors">
                  Retake
                </button>
              </div>
            </div>
          )}

          {/* No image yet — show add button */}
          {!capturedPreview && cameraState === 'closed' && (
            <button type="button" onClick={startCamera}
              className="w-full h-24 border border-dashed border-white/15 hover:border-violet-500/40 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-violet-400 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">Add plate photo</span>
            </button>
          )}
        </div>

        {/* Vehicle number — auto-filled by OCR, still editable */}
        <div className="md:col-span-2">
          <label className={labelCls}>
            Vehicle Number
            <span className="ml-1 text-zinc-600 font-normal">(required if no photo)</span>
          </label>
          <input
            type="text"
            value={formData.vehicle_number}
            onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
            className={`${inputCls} uppercase`}
            placeholder={ocrStatus === 'scanning' ? 'Detecting from photo…' : 'WB 01 AB 1234'}
          />
        </div>

        <div>
          <label className={labelCls}>Email <span className="text-red-500">*</span></label>
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="rider@example.com" />
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

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
