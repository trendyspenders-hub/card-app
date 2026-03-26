'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Eye, EyeOff, Layers } from 'lucide-react';
import type { CenteringResult, CornerResult, SurfaceResult } from '@/types';

interface AnnotatedImageProps {
  imageUrl: string;
  annotatedImageUrl?: string;
  centering: CenteringResult;
  corners: CornerResult;
  surface: SurfaceResult;
}

type Overlay = 'centering' | 'corners' | 'surface';

function getSeverityColor(severity: string): string {
  if (severity === 'severe') return 'rgba(239,68,68,0.7)';
  if (severity === 'moderate') return 'rgba(249,115,22,0.7)';
  return 'rgba(234,179,8,0.6)';
}

export default function AnnotatedImage({
  imageUrl,
  annotatedImageUrl,
  centering,
  corners,
  surface,
}: AnnotatedImageProps) {
  const [zoom, setZoom] = useState(1);
  const [activeOverlays, setActiveOverlays] = useState<Set<Overlay>>(
    new Set(['centering', 'corners', 'surface'])
  );
  const [showAnnotated, setShowAnnotated] = useState(false);

  const toggleOverlay = (overlay: Overlay) => {
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(overlay)) next.delete(overlay);
      else next.add(overlay);
      return next;
    });
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

  const displayUrl = showAnnotated && annotatedImageUrl ? annotatedImageUrl : imageUrl;

  // SVG overlay dimensions (relative percentages)
  const svgW = 100;
  const svgH = 100;

  // Centering lines (simplified representation)
  const borderL = (centering.leftPct / 100) * svgW;
  const borderR = svgW - (centering.rightPct / 100) * svgW;
  const borderT = (centering.topPct / 100) * svgH;
  const borderB = svgH - (centering.bottomPct / 100) * svgH;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-1">
          <Layers className="h-4 w-4 text-gray-500 mr-1" />
          <span className="text-xs text-gray-400 mr-2">Overlays:</span>
          {(['centering', 'corners', 'surface'] as Overlay[]).map((overlay) => (
            <button
              key={overlay}
              onClick={() => toggleOverlay(overlay)}
              className={`rounded px-2 py-1 text-xs capitalize transition-colors ${
                activeOverlays.has(overlay)
                  ? overlay === 'centering'
                    ? 'bg-blue-500/20 text-blue-400'
                    : overlay === 'corners'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-red-500/20 text-red-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {overlay}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {annotatedImageUrl && (
            <button
              onClick={() => setShowAnnotated(!showAnnotated)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                showAnnotated ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {showAnnotated ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {showAnnotated ? 'Annotated' : 'Original'}
            </button>
          )}
          <button
            onClick={zoomOut}
            className="rounded p-1 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={zoomIn}
            className="rounded p-1 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image display */}
      <div
        className="relative overflow-auto bg-gray-950"
        style={{ maxHeight: '500px' }}
      >
        <div
          className="relative inline-block"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
          }}
        >
          <img
            src={displayUrl}
            alt="Card analysis"
            className="block max-w-full"
            style={{ minWidth: 300 }}
          />

          {/* SVG overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${svgW} ${svgH}`}
            preserveAspectRatio="none"
          >
            {/* Centering overlay */}
            {activeOverlays.has('centering') && (
              <g>
                {/* Border lines */}
                <line
                  x1={borderL} y1={0}
                  x2={borderL} y2={svgH}
                  stroke="rgba(99,102,241,0.7)"
                  strokeWidth="0.4"
                  strokeDasharray="2 1"
                />
                <line
                  x1={borderR} y1={0}
                  x2={borderR} y2={svgH}
                  stroke="rgba(99,102,241,0.7)"
                  strokeWidth="0.4"
                  strokeDasharray="2 1"
                />
                <line
                  x1={0} y1={borderT}
                  x2={svgW} y2={borderT}
                  stroke="rgba(99,102,241,0.7)"
                  strokeWidth="0.4"
                  strokeDasharray="2 1"
                />
                <line
                  x1={0} y1={borderB}
                  x2={svgW} y2={borderB}
                  stroke="rgba(99,102,241,0.7)"
                  strokeWidth="0.4"
                  strokeDasharray="2 1"
                />
                {/* Center crosshair */}
                <line x1="48" y1="50" x2="52" y2="50" stroke="rgba(99,102,241,0.9)" strokeWidth="0.5" />
                <line x1="50" y1="48" x2="50" y2="52" stroke="rgba(99,102,241,0.9)" strokeWidth="0.5" />
              </g>
            )}

            {/* Corner indicators */}
            {activeOverlays.has('corners') && (
              <g>
                {[
                  { x: borderL, y: borderT, score: corners.frontLeft, label: 'FL' },
                  { x: borderR, y: borderT, score: corners.frontRight, label: 'FR' },
                  { x: borderL, y: borderB, score: corners.backLeft, label: 'BL' },
                  { x: borderR, y: borderB, score: corners.backRight, label: 'BR' },
                ].map((corner) => {
                  const color =
                    corner.score >= 9 ? 'rgba(16,185,129,0.9)' :
                    corner.score >= 7 ? 'rgba(234,179,8,0.9)' : 'rgba(239,68,68,0.9)';
                  return (
                    <g key={corner.label}>
                      <circle cx={corner.x} cy={corner.y} r="2.5" fill={color} opacity="0.8" />
                      <text
                        x={corner.x + (corner.x > 50 ? -4 : 1)}
                        y={corner.y + (corner.y > 50 ? -1.5 : 3.5)}
                        fontSize="3"
                        fill={color}
                        fontWeight="bold"
                      >
                        {corner.score.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Surface defects */}
            {activeOverlays.has('surface') &&
              surface.scratches.map((defect, i) => {
                // Convert pixel coords to percentages (approximate)
                const x = (defect.x / 1024) * 100;
                const y = (defect.y / 768) * 100;
                const w = (defect.width / 1024) * 100;
                const h = (defect.height / 768) * 100;

                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={Math.max(w, 2)}
                    height={Math.max(h, 1)}
                    fill="none"
                    stroke={getSeverityColor(defect.severity)}
                    strokeWidth="0.5"
                    rx="0.3"
                  />
                );
              })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t border-gray-800 px-4 py-2">
        {activeOverlays.has('centering') && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="h-0.5 w-5 bg-indigo-500/70" style={{ borderTop: '1px dashed rgba(99,102,241,0.7)' }} />
            <span>Centering</span>
          </div>
        )}
        {activeOverlays.has('corners') && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Corners</span>
          </div>
        )}
        {activeOverlays.has('surface') && surface.scratches.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="h-3 w-4 rounded border border-red-500/70" />
            <span>Defects</span>
          </div>
        )}
      </div>
    </div>
  );
}
