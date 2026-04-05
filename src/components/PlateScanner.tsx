'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

// Indian plate format — covers BH series too: MH01AB1234, WB01AB1234, 22BH1234AA
const PLATE_REGEX = /([A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}|\d{2}BH\d{4}[A-Z]{1,2})/i;

function normalise(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

function preprocessCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const dst = document.createElement('canvas');
  // Upscale for better OCR — Tesseract likes at least 300px wide
  const scale = Math.max(1, 640 / src.width);
  dst.width = src.width * scale;
  dst.height = src.height * scale;
  const ctx = dst.getContext('2d')!;

  ctx.drawImage(src, 0, 0, dst.width, dst.height);

  // Grayscale + contrast boost
  const img = ctx.getImageData(0, 0, dst.width, dst.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // Contrast stretch: push dark → darker, light → lighter
    const stretched = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
    d[i] = d[i + 1] = d[i + 2] = stretched;
  }
  ctx.putImageData(img, 0, 0);
  return dst;
}

interface PlateScannerProps {
  /** Called with the normalised plate string once detected */
  onDetect: (plate: string) => void;
  /** Optional cancel/close handler */
  onCancel?: () => void;
  /** If true, auto-trigger OCR after capture without requiring a second tap */
  autoOcr?: boolean;
}

type ScanState = 'idle' | 'capturing' | 'processing' | 'done' | 'error';

export default function PlateScanner({ onDetect, onCancel, autoOcr = true }: PlateScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<ScanState>('idle');
  const [preview, setPreview] = useState<string | null>(null);   // data URL of captured frame
  const [detected, setDetected] = useState<string | null>(null); // extracted plate text
  const [errorMsg, setErrorMsg] = useState('');

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('idle');
    } catch {
      setState('error');
      setErrorMsg('Camera access denied. Please allow camera permissions.');
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

    setState('capturing');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPreview(dataUrl);

    if (autoOcr) await runOcr(canvas);
    else setState('capturing'); // wait for manual confirm
  }, [autoOcr]);

  const runOcr = async (canvas: HTMLCanvasElement) => {
    setState('processing');
    setDetected(null);
    setErrorMsg('');

    try {
      // Lazy-load Tesseract — keeps initial bundle small
      const { createWorker } = await import('tesseract.js');
      const processed = preprocessCanvas(canvas);

      const worker = await createWorker('eng');
      await worker.setParameters({
        // Only alphanumeric — plates never have other chars
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
        // PSM 7 = single text line, good for plates
        tessedit_pageseg_mode: '7' as never,
      });

      const { data } = await worker.recognize(processed);
      await worker.terminate();

      const raw = data.text.trim().toUpperCase();
      const match = raw.match(PLATE_REGEX);

      if (match) {
        const plate = normalise(match[0]);
        setDetected(plate);
        setState('done');
      } else {
        setState('error');
        setErrorMsg(`Could not read a plate. Detected: "${raw || '(nothing)'}". Try better lighting or move closer.`);
      }
    } catch (err) {
      setState('error');
      setErrorMsg('OCR failed. Please try again.');
      console.error(err);
    }
  };

  const retake = () => {
    setPreview(null);
    setDetected(null);
    setErrorMsg('');
    setState('idle');
    // Restart camera if it was stopped
    if (!streamRef.current) startCamera();
  };

  const confirm = () => {
    if (detected) {
      stopCamera();
      onDetect(detected);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Live feed — hidden once frame captured */}
      {!preview && (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {/* Plate guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-violet-400/60 rounded-md w-3/4 h-1/4 flex items-center justify-center">
              <span className="text-violet-300/70 text-xs font-medium tracking-wide">Align plate here</span>
            </div>
          </div>
        </div>
      )}

      {/* Captured preview */}
      {preview && (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Captured frame" className="w-full h-full object-cover" />
          {state === 'processing' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-zinc-300 text-xs">Reading plate…</span>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Result */}
      {state === 'done' && detected && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Detected plate</p>
            <p className="text-emerald-400 font-mono font-bold text-lg tracking-widest">{detected}</p>
          </div>
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {state === 'error' && errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <p className="text-red-400 text-xs">{errorMsg}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {(state === 'idle') && (
          <button
            onClick={capture}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture Plate
          </button>
        )}

        {(state === 'done') && (
          <>
            <button onClick={retake} className="flex-1 bg-white/5 hover:bg-white/8 text-zinc-400 text-sm font-medium py-2.5 rounded-lg transition-colors">
              Retake
            </button>
            <button onClick={confirm} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              Use this plate
            </button>
          </>
        )}

        {(state === 'error') && (
          <button onClick={retake} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            Try again
          </button>
        )}

        {onCancel && state !== 'processing' && (
          <button onClick={() => { stopCamera(); onCancel(); }} className="px-4 bg-white/5 hover:bg-white/8 text-zinc-500 text-sm py-2.5 rounded-lg transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
