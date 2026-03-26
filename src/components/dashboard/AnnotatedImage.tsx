'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CenteringResult, CornerResult, SurfaceResult } from '@/types';

type Overlay = 'centering' | 'corners' | 'surface';

interface Props {
  imageUrl: string;
  annotatedImageUrl?: string;
  centering: CenteringResult;
  corners: CornerResult;
  surface: SurfaceResult;
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'rgba(234,179,8,0.7)',
  moderate: 'rgba(249,115,22,0.7)',
  severe: 'rgba(239,68,68,0.8)',
};

export default function AnnotatedImage({ imageUrl, centering, corners, surface }: Props) {
  const [zoom, setZoom] = useState(1);
  const [activeOverlays, setActiveOverlays] = useState<Set<Overlay>>(
    new Set<Overlay>(['centering', 'corners', 'surface'])
  );

  const toggleOverlay = (o: Overlay) => {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      next.has(o) ? next.delete(o) : next.add(o);
      return next;
    });
  };

  const cornerLabels: { key: keyof CornerResult; label: string; pos: string }[] = [
    { key: 'frontLeft',  label: 'FL', pos: 'top-1 left-1' },
    { key: 'frontRight', label: 'FR', pos: 'top-1 right-1' },
    { key: 'backLeft',   label: 'BL', pos: 'bottom-1 left-1' },
    { key: 'backRight',  label: 'BR', pos: 'bottom-1 right-1' },
  ];

  const scoreColor = (s: number) =>
    s >= 9 ? 'bg-emerald-500' : s >= 7 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-3">
      {/* Overlay toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        <Layers className="w-4 h-4 text-gray-400" />
        {(['centering', 'corners', 'surface'] as Overlay[]).map(o => (
          <button
            key={o}
            onClick={() => toggleOverlay(o)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              activeOverlays.has(o)
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            {o}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Image with SVG overlays */}
      <div className="relative overflow-auto rounded-lg bg-gray-900 border border-gray-800" style={{ maxHeight: 480 }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'inline-block', position: 'relative' }}>
          <Image
            src={imageUrl}
            alt="Card"
            width={400}
            height={560}
            className="block"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {/* SVG overlay layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 400 560"
            preserveAspectRatio="none"
          >
            {/* Centering lines */}
            {activeOverlays.has('centering') && (() => {
              const totalH = centering.left + centering.right || 1;
              const totalV = centering.top + centering.bottom || 1;
              const lPct = centering.left / totalH;
              const tPct = centering.top / totalV;
              return (
                <>
                  <line x1={400 * lPct} y1="0" x2={400 * lPct} y2="560" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 2" />
                  <line x1="0" y1={560 * tPct} x2="400" y2={560 * tPct} stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 2" />
                </>
              );
            })()}

            {/* Surface defects */}
            {activeOverlays.has('surface') && surface.scratches.map((d, i) => (
              <rect
                key={i}
                x={d.x} y={d.y} width={d.width} height={d.height}
                fill="none"
                stroke={SEVERITY_COLORS[d.severity] ?? 'rgba(239,68,68,0.8)'}
                strokeWidth="1.5"
                rx="2"
              />
            ))}
          </svg>

          {/* Corner score badges */}
          {activeOverlays.has('corners') && cornerLabels.map(({ key, label, pos }) => {
            const score = corners[key] as number;
            return (
              <div key={key} className={`absolute ${pos}`}>
                <span className={`text-[10px] font-bold text-white px-1 py-0.5 rounded ${scoreColor(score)}`}>
                  {label} {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-500 inline-block" /> Centering</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 border border-yellow-500 inline-block rounded-sm" /> Defects</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 inline-block rounded-sm" /> Corners</span>
      </div>
    </div>
  );
}
