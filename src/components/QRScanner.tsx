'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, VideoInputDevice } from '@zxing/library';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<VideoInputDevice[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    const loadDevices = async () => {
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        setDevices(videoInputDevices);
        
        // Find back camera index if possible
        const backCameraIndex = videoInputDevices.findIndex(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        if (backCameraIndex !== -1) {
          setCurrentDeviceIndex(backCameraIndex);
        }
      } catch (err) {
        console.error('Error listing video devices:', err);
      }
    };

    loadDevices();

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  const startScanning = async (deviceIndex: number = currentDeviceIndex) => {
    try {
      setError('');
      setIsScanning(true);

      if (!readerRef.current || !videoRef.current) {
        throw new Error('Scanner not initialized');
      }

      if (devices.length === 0) {
        const videoInputDevices = await readerRef.current.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          throw new Error('No camera found');
        }
        setDevices(videoInputDevices);
      }

      const selectedDeviceId = devices[deviceIndex]?.deviceId || devices[0].deviceId;

      // Reset before starting a new one
      readerRef.current.reset();

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

  const switchCamera = () => {
    if (devices.length <= 1) return;
    
    const nextIndex = (currentDeviceIndex + 1) % devices.length;
    setCurrentDeviceIndex(nextIndex);
    
    if (isScanning) {
      // Re-start with next device
      startScanning(nextIndex);
    }
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 border-4 border-purple-500 rounded-lg"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex gap-3">
          {!isScanning ? (
            <button
              onClick={() => startScanning()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Stop
            </button>
          )}
          
          {devices.length > 1 && (
            <button
              onClick={switchCamera}
              className="bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
              title="Switch Camera"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          )}
        </div>
        
        {devices.length > 0 && (
          <p className="text-center text-xs text-gray-500">
            Using: {devices[currentDeviceIndex]?.label || `Camera ${currentDeviceIndex + 1}`}
          </p>
        )}
      </div>
    </div>
  );
}
