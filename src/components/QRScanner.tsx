'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<any[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    const loadDevices = async () => {
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        setDevices(videoInputDevices);
        const backCameraIndex = videoInputDevices.findIndex(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        if (backCameraIndex !== -1) setCurrentDeviceIndex(backCameraIndex);
      } catch (err) {
        console.error('Error listing video devices:', err);
      }
    };

    loadDevices();
    return () => { readerRef.current?.reset(); };
  }, []);

  const startScanning = async (deviceIndex: number = currentDeviceIndex) => {
    try {
      setError('');
      setIsScanning(true);
      if (!readerRef.current || !videoRef.current) throw new Error('Scanner not initialized');
      if (devices.length === 0) {
        const videoInputDevices = await readerRef.current.listVideoInputDevices();
        if (videoInputDevices.length === 0) throw new Error('No camera found');
        setDevices(videoInputDevices);
      }
      const selectedDeviceId = devices[deviceIndex]?.deviceId || devices[0].deviceId;
      readerRef.current.reset();
      readerRef.current.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
        if (result) { onScan(result.getText()); stopScanning(); }
        if (err && err.name !== 'NotFoundException') console.error('Scan error:', err);
      });
    } catch (err: any) {
      const msg = err.message || 'Failed to start camera';
      setError(msg);
      setIsScanning(false);
      onError?.(msg);
    }
  };

  const stopScanning = () => {
    readerRef.current?.reset();
    setIsScanning(false);
  };

  const switchCamera = () => {
    if (devices.length <= 1) return;
    const next = (currentDeviceIndex + 1) % devices.length;
    setCurrentDeviceIndex(next);
    if (isScanning) startScanning(next);
  };

  return (
    <div className="w-full">
      {/* Viewfinder */}
      <div className="relative bg-[#111] rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ display: isScanning ? 'block' : 'none' }}
        />

        {/* Idle state */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="opacity-20">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h1m4 0h1M14 18h2m3 0h1M14 21h1m4-4v4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-zinc-500 text-sm">Camera feed will appear here</p>
          </div>
        )}

        {/* Scanning overlay */}
        {isScanning && (
          <>
            {/* Dark vignette edges */}
            <div className="absolute inset-0 shadow-[inset_0_0_60px_20px_rgba(0,0,0,0.7)] pointer-events-none" />

            {/* Corner brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-52">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-violet-400 rounded-tl-md" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-violet-400 rounded-tr-md" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-violet-400 rounded-bl-md" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-violet-400 rounded-br-md" />
              </div>
            </div>

            {/* Scan line */}
            <div
              className="absolute left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-scan-line pointer-events-none"
              style={{ boxShadow: '0 0 8px 2px rgba(139,92,246,0.5)' }}
            />

            {/* Label */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
              <span className="bg-black/50 backdrop-blur-sm text-xs text-zinc-300 px-3 py-1 rounded-full">
                Scanning…
              </span>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex gap-3">
        {!isScanning ? (
          <button
            onClick={() => startScanning()}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stop
          </button>
        )}

        {devices.length > 1 && (
          <button
            onClick={switchCamera}
            title="Switch camera"
            className="px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {devices.length > 0 && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          {devices[currentDeviceIndex]?.label || `Camera ${currentDeviceIndex + 1}`}
        </p>
      )}
    </div>
  );
}
