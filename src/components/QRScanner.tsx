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
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);

      if (!readerRef.current || !videoRef.current) {
        throw new Error('Scanner not initialized');
      }

      const videoInputDevices = await readerRef.current.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found');
      }

      // Use the first available camera (usually back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const scannedData = result.getText();
            onScan(scannedData);
            stopScanning();
          }
          if (err && err.name !== 'NotFoundException') {
            console.error('Scan error:', err);
          }
        }
      );
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start camera';
      setError(errorMessage);
      setIsScanning(false);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-xl">
        <video
          ref={videoRef}
          className="w-full aspect-video md:h-80 object-cover"
          style={{ display: isScanning ? 'block' : 'none' }}
        />
        
        {!isScanning && (
          <div className="aspect-video md:h-80 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center p-6">
              <svg
                className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <p className="text-gray-400">Ready to scan QR code</p>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-purple-500 opacity-50 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-purple-500 rounded-lg"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-all shadow-lg"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
}
