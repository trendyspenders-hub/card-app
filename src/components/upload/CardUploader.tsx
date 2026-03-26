'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, X, RotateCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GuidedOverlay from './GuidedOverlay';
import type { AnalysisResult } from '@/types';

type UploadStep =
  | 'idle'
  | 'preview'
  | 'uploading'
  | 'analyzing_centering'
  | 'analyzing_corners'
  | 'analyzing_surface'
  | 'calculating_grade'
  | 'complete'
  | 'error';

const STEP_LABELS: Record<UploadStep, string> = {
  idle: 'Ready',
  preview: 'Ready to analyze',
  uploading: 'Uploading image...',
  analyzing_centering: 'Analyzing centering...',
  analyzing_corners: 'Checking corners...',
  analyzing_surface: 'Scanning surface...',
  calculating_grade: 'Calculating grade...',
  complete: 'Analysis complete!',
  error: 'Error occurred',
};

const STEP_ORDER: UploadStep[] = [
  'uploading',
  'analyzing_centering',
  'analyzing_corners',
  'analyzing_surface',
  'calculating_grade',
  'complete',
];

interface CardUploaderProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  playerName?: string;
  year?: string;
  cardSet?: string;
  cardNumber?: string;
}

export default function CardUploader({
  onAnalysisComplete,
  playerName = '',
  year = '',
  cardSet = '',
  cardNumber = '',
}: CardUploaderProps) {
  const [step, setStep] = useState<UploadStep>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cardDetected, setCardDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentStepIndex = STEP_ORDER.indexOf(step);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep('preview');
    setError(null);
    setRotation(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (rejected) => {
      const err = rejected[0]?.errors[0];
      setError(err?.message || 'File rejected. Please use JPG, PNG, or WebP under 10MB.');
      setStep('error');
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Simulate card detection after 2 seconds
      setTimeout(() => setCardDetected(true), 2000);
    } catch (err) {
      setError('Camera access denied. Please use file upload instead.');
      console.error(err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        setFile(capturedFile);
        setPreview(URL.createObjectURL(capturedFile));
        setStep('preview');
        stopCamera();
      },
      'image/jpeg',
      0.95
    );
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCardDetected(false);
  };

  const rotateImage = () => setRotation((r) => (r + 90) % 360);

  const clearImage = () => {
    setPreview(null);
    setFile(null);
    setStep('idle');
    setError(null);
    setRotation(0);
    stopCamera();
  };

  const simulateStepDelay = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay));

  const runAnalysis = async () => {
    if (!file) return;
    setError(null);

    try {
      setStep('uploading');
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await fetch('/api/analyze/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { imageUrl, key } = await uploadRes.json();

      setStep('analyzing_centering');
      await simulateStepDelay(600);

      setStep('analyzing_corners');
      await simulateStepDelay(600);

      setStep('analyzing_surface');
      await simulateStepDelay(600);

      setStep('calculating_grade');

      const gradeRes = await fetch('/api/analyze/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, key, playerName, year, set: cardSet, cardNumber }),
      });

      if (!gradeRes.ok) {
        const err = await gradeRes.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const result: AnalysisResult = await gradeRes.json();
      setStep('complete');
      await simulateStepDelay(500);
      onAnalysisComplete(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setStep('error');
    }
  };

  const isProcessing = ['uploading', 'analyzing_centering', 'analyzing_corners', 'analyzing_surface', 'calculating_grade'].includes(step);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {cameraActive ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative rounded-2xl overflow-hidden bg-black border border-gray-800"
            style={{ aspectRatio: '16/9' }}
          >
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <GuidedOverlay cardDetected={cardDetected} width={640} height={360} />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
              <Button variant="outline" size="sm" onClick={stopCamera}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="lg"
                onClick={capturePhoto}
                className={cardDetected ? 'bg-emerald-600 hover:bg-emerald-500' : ''}
              >
                <Camera className="h-5 w-5" />
                Capture
              </Button>
            </div>
          </motion.div>
        ) : step === 'idle' ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div
              {...getRootProps()}
              className={`
                relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all
                ${isDragActive
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-indigo-600/20 p-4">
                  <Upload className="h-8 w-8 text-indigo-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white">
                    {isDragActive ? 'Drop your card here' : 'Upload your card'}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Drag & drop or click to browse
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG, WebP up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 border-t border-gray-800" />
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-800" />
            </div>

            <Button
              variant="outline"
              size="lg"
              className="mt-4 w-full"
              onClick={startCamera}
            >
              <Camera className="h-5 w-5" />
              Use Camera
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden"
          >
            {/* Image preview */}
            <div className="relative bg-gray-950" style={{ aspectRatio: '4/3' }}>
              {preview && (
                <img
                  src={preview}
                  alt="Card preview"
                  className="h-full w-full object-contain transition-transform duration-300"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              )}

              {!isProcessing && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={rotateImage}
                    className="rounded-lg bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                    title="Rotate image"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={clearImage}
                    className="rounded-lg bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-4 border-gray-700" />
                      <motion.div
                        className="absolute inset-0 h-16 w-16 rounded-full border-4 border-indigo-500 border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">
                        {STEP_LABELS[step]}
                      </p>
                      <div className="mt-3 flex gap-2 justify-center">
                        {STEP_ORDER.slice(0, -1).map((s, i) => (
                          <div
                            key={s}
                            className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                              i <= currentStepIndex - 1
                                ? 'bg-indigo-500'
                                : i === currentStepIndex
                                ? 'bg-indigo-500/60'
                                : 'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 'complete' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <CheckCircle className="h-20 w-20 text-emerald-500" />
                  </motion.div>
                </div>
              )}
            </div>

            {/* Controls */}
            {(step === 'preview' || step === 'error') && (
              <div className="p-4">
                {step === 'error' && error && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={clearImage} className="flex-1">
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                  <Button
                    onClick={runAnalysis}
                    className="flex-2 flex-grow"
                    size="lg"
                  >
                    Analyze Card
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      {step === 'idle' && (
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '💡', text: 'Use good lighting, avoid glare' },
            { icon: '📐', text: 'Keep card flat and straight' },
            { icon: '🔍', text: 'Fill the frame for best results' },
          ].map((tip) => (
            <div
              key={tip.text}
              className="rounded-lg bg-gray-900/50 border border-gray-800 p-3"
            >
              <div className="text-xl mb-1">{tip.icon}</div>
              <p className="text-xs text-gray-400">{tip.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
