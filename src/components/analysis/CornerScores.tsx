'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CornerResult } from '@/types';

interface CornerScoresProps {
  corners: CornerResult;
  imageUrl?: string;
}

function getCornerColor(score: number): string {
  if (score >= 9) return 'text-emerald-400';
  if (score >= 7) return 'text-yellow-400';
  return 'text-red-400';
}

function getCornerBgColor(score: number): string {
  if (score >= 9) return 'bg-emerald-500/20 border-emerald-500/40';
  if (score >= 7) return 'bg-yellow-500/20 border-yellow-500/40';
  return 'bg-red-500/20 border-red-500/40';
}

function getCornerDescription(score: number): string {
  if (score >= 9.5) return 'Perfect sharp point, no wear visible';
  if (score >= 8.5) return 'Nearly perfect, very slight wear';
  if (score >= 7.5) return 'Minor fraying or rounding visible';
  if (score >= 6.5) return 'Noticeable fraying, some rounding';
  if (score >= 5.5) return 'Significant wear or blunting';
  return 'Heavy wear, blunt or damaged';
}

function getCornerBadgeVariant(score: number): 'success' | 'warning' | 'destructive' {
  if (score >= 8) return 'success';
  if (score >= 6) return 'warning';
  return 'destructive';
}

interface CornerBadgeProps {
  label: string;
  score: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

function CornerBadge({ label, score, position }: CornerBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={`relative cursor-pointer rounded-lg border p-2 text-center w-20 ${getCornerBgColor(score)}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        <div className={`text-2xl font-bold ${getCornerColor(score)}`}>
          {score.toFixed(1)}
        </div>
      </motion.div>

      {showTooltip && (
        <div
          className={`absolute z-20 w-48 rounded-lg bg-gray-800 border border-gray-700 p-3 text-xs text-gray-300 shadow-xl
            ${position.includes('right') ? 'right-0' : 'left-0'}
            ${position.includes('bottom') ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
        >
          <div className={`font-semibold mb-1 ${getCornerColor(score)}`}>
            Score: {score.toFixed(1)}/10
          </div>
          <p>{getCornerDescription(score)}</p>
        </div>
      )}
    </div>
  );
}

export default function CornerScores({ corners, imageUrl }: CornerScoresProps) {
  const overall = corners.overall;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Corner Wear</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getCornerBadgeVariant(overall)}>
              {overall >= 9 ? 'Excellent' : overall >= 7 ? 'Good' : 'Fair'}
            </Badge>
            <span className={`text-2xl font-bold ${getCornerColor(overall)}`}>
              {overall.toFixed(1)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto" style={{ width: 280, height: 200 }}>
          {/* Card placeholder image */}
          <div className="absolute inset-[40px] rounded-lg border-2 border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Card" className="h-full w-full object-cover opacity-80" />
            ) : (
              <div className="text-center">
                <div className="text-gray-600 text-4xl mb-1">🃏</div>
                <p className="text-xs text-gray-600">Card Front</p>
              </div>
            )}
          </div>

          {/* Corner badges */}
          <div className="absolute top-0 left-0">
            <CornerBadge label="FL" score={corners.frontLeft} position="top-left" />
          </div>
          <div className="absolute top-0 right-0">
            <CornerBadge label="FR" score={corners.frontRight} position="top-right" />
          </div>
          <div className="absolute bottom-0 left-0">
            <CornerBadge label="BL" score={corners.backLeft} position="bottom-left" />
          </div>
          <div className="absolute bottom-0 right-0">
            <CornerBadge label="BR" score={corners.backRight} position="bottom-right" />
          </div>
        </div>

        {/* Individual corner bars */}
        <div className="mt-4 space-y-2">
          {[
            { label: 'Front Left', score: corners.frontLeft },
            { label: 'Front Right', score: corners.frontRight },
            { label: 'Back Left', score: corners.backLeft },
            { label: 'Back Right', score: corners.backRight },
          ].map((corner) => (
            <div key={corner.label} className="flex items-center gap-3">
              <span className="w-24 text-xs text-gray-400 text-right">{corner.label}</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    corner.score >= 9 ? 'bg-emerald-500' :
                    corner.score >= 7 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${corner.score * 10}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>
              <span className={`w-8 text-xs font-bold ${getCornerColor(corner.score)}`}>
                {corner.score.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg bg-gray-800/60 p-3">
          <p className="text-xs text-gray-400 text-center">
            Overall: <span className={`font-bold ${getCornerColor(overall)}`}>{overall.toFixed(1)}/10</span>
            {' — '}{getCornerDescription(overall)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
