'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, X, RotateCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  // Native camera input ref (works on iOS/Android reliably)
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STEP_ORDER.indexOf(step);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep('preview');
    setError(null);
    setRotation(0);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) handleFile(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (rejected) => {
      const err = rejected[0]?.errors[0];
      setError(err?.message || 'File rejected. Use JPG, PNG, or WebP under 10MB.');
      setStep('error');
    },
  });

  // Native camera — opens iOS/Android camera app directly
  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const onCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    // Reset input so same photo can be retaken
    e.target.value = '';
  };

  const rotateImage = () => setRotation((r) => (r + 90) % 360);

  const clearImage = () => {
    setPreview(null);
    setFile(null);
    setStep('idle');
    setError(null);
    setRotation(0);
  };

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
      await new Promise((r) => setTimeout(r, 600));
      setStep('analyzing_corners');
      await new Promise((r) => setTimeout(r, 600));
      setStep('analyzing_surface');
      await new Promise((r) => setTimeout(r, 600));
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
      await new Promise((r) => setTimeout(r, 500));
      onAnalysisComplete(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setStep('error');
    }
  };

  const isProcessing = [
    'uploading', 'analyzing_centering', 'analyzing_corners',
    'analyzing_surface', 'calculating_grade',
  ].includes(step);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Hidden native camera input — most reliable on iOS/Android */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onCameraCapture}
      />

      <AnimatePresence mode="wait">
        {step === 'idle' || step === 'error' ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Error banner */}
            {step === 'error' && error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300
                ${isDragActive
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900'
                }`}
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
                  <p className="mt-1 text-sm text-gray-400">Drag & drop or tap to browse</p>
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP up to 10MB</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 border-t border-gray-800" />
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-800" />
            </div>

            {/* Camera button — uses native camera on mobile */}
            <Button
              variant="outline"
              size="lg"
              className="mt-4 w-full"
              onClick={openCamera}
            >
              <Camera className="h-5 w-5" />
              Take Photo
            </Button>

            {/* Tips */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '💡', text: 'Good lighting, avoid flash' },
                { icon: '📐', text: 'Keep card flat & straight' },
                { icon: '🔍', text: 'Fill the frame' },
              ].map((tip) => (
                <div key={tip.text} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                  <div className="text-xl mb-1">{tip.icon}</div>
                  <p className="text-xs text-gray-400">{tip.text}</p>
                </div>
              ))}
            </div>
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

              {!isProcessing && step !== 'complete' && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={rotateImage}
                    className="rounded-lg bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                    title="Rotate"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={clearImage}
                    className="rounded-lg bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Processing overlay */}
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
                      <p className="text-lg font-semibold text-white">{STEP_LABELS[step]}</p>
                      <div className="mt-3 flex gap-2 justify-center">
                        {STEP_ORDER.slice(0, -1).map((s, i) => (
                          <div key={s} className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                            i < currentStepIndex ? 'bg-indigo-500'
                            : i === currentStepIndex ? 'bg-indigo-500/60'
                            : 'bg-gray-700'
                          }`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 'complete' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <CheckCircle className="h-20 w-20 text-emerald-500" />
                  </motion.div>
                </div>
              )}
            </div>

            {/* Controls */}
            {step === 'preview' && (
              <div className="p-4 flex gap-3">
                <Button variant="outline" onClick={clearImage} className="flex-1">
                  <X className="h-4 w-4" /> Clear
                </Button>
                <Button onClick={runAnalysis} className="flex-grow" size="lg">
                  Analyze Card
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
