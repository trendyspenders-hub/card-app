'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SurfaceResult, Defect } from '@/types';

interface SurfaceAnalysisProps {
  surface: SurfaceResult;
}

function getSeverityColor(severity: Defect['severity']): string {
  switch (severity) {
    case 'minor': return 'text-yellow-400';
    case 'moderate': return 'text-orange-400';
    case 'severe': return 'text-red-400';
  }
}

function getSeverityBadgeVariant(severity: Defect['severity']): 'warning' | 'destructive' | 'default' {
  switch (severity) {
    case 'minor': return 'warning';
    case 'moderate': return 'destructive';
    case 'severe': return 'destructive';
  }
}

function getSurfaceGrade(score: number) {
  if (score >= 9.5) return { label: 'Pristine', badge: 'success' as const };
  if (score >= 8.5) return { label: 'Near Mint+', badge: 'success' as const };
  if (score >= 7.5) return { label: 'Near Mint', badge: 'warning' as const };
  if (score >= 6.5) return { label: 'Excellent', badge: 'warning' as const };
  return { label: 'Fair or Less', badge: 'destructive' as const };
}

export default function SurfaceAnalysis({ surface }: SurfaceAnalysisProps) {
  const [showDefects, setShowDefects] = useState(true);
  const gradeInfo = getSurfaceGrade(surface.score);

  const scratchCount = surface.scratches.length;
  const severeCount = surface.scratches.filter((s) => s.severity === 'severe').length;
  const moderateCount = surface.scratches.filter((s) => s.severity === 'moderate').length;
  const minorCount = surface.scratches.filter((s) => s.severity === 'minor').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Surface</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={gradeInfo.badge}>{gradeInfo.label}</Badge>
            <span
              className={`text-2xl font-bold ${
                surface.score >= 9 ? 'text-emerald-400' :
                surface.score >= 7 ? 'text-yellow-400' : 'text-red-400'
              }`}
            >
              {surface.score.toFixed(1)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall score bar */}
        <Progress
          value={surface.score * 10}
          label="Surface Score"
          showValue
          size="md"
        />

        {/* Issue indicators */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-lg border p-3 text-center ${
            scratchCount === 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div className="mb-1">
              {scratchCount === 0
                ? <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto" />
                : <AlertTriangle className="h-5 w-5 text-red-400 mx-auto" />
              }
            </div>
            <div className={`text-lg font-bold ${scratchCount === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {scratchCount}
            </div>
            <div className="text-xs text-gray-400">Scratches</div>
          </div>

          <div className={`rounded-lg border p-3 text-center ${
            !surface.printLines ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-orange-500/30 bg-orange-500/10'
          }`}>
            <div className="mb-1">
              {!surface.printLines
                ? <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto" />
                : <AlertTriangle className="h-5 w-5 text-orange-400 mx-auto" />
              }
            </div>
            <div className={`text-sm font-bold ${!surface.printLines ? 'text-emerald-400' : 'text-orange-400'}`}>
              {surface.printLines ? 'Found' : 'None'}
            </div>
            <div className="text-xs text-gray-400">Print Lines</div>
          </div>

          <div className={`rounded-lg border p-3 text-center ${
            !surface.holoDamage ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div className="mb-1">
              {!surface.holoDamage
                ? <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto" />
                : <AlertTriangle className="h-5 w-5 text-red-400 mx-auto" />
              }
            </div>
            <div className={`text-sm font-bold ${!surface.holoDamage ? 'text-emerald-400' : 'text-red-400'}`}>
              {surface.holoDamage ? 'Damaged' : 'Clean'}
            </div>
            <div className="text-xs text-gray-400">Holo/Foil</div>
          </div>
        </div>

        {/* Scratch breakdown */}
        {scratchCount > 0 && (
          <div className="rounded-lg bg-gray-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Detected Defects</span>
              <button
                onClick={() => setShowDefects(!showDefects)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                {showDefects ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showDefects ? 'Hide' : 'Show'}
              </button>
            </div>

            {showDefects && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {severeCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-xs text-gray-300">Severe</span>
                    </div>
                    <Badge variant="destructive">{severeCount}</Badge>
                  </div>
                )}
                {moderateCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-xs text-gray-300">Moderate</span>
                    </div>
                    <Badge variant="destructive">{moderateCount}</Badge>
                  </div>
                )}
                {minorCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span className="text-xs text-gray-300">Minor</span>
                    </div>
                    <Badge variant="warning">{minorCount}</Badge>
                  </div>
                )}

                {surface.scratches.slice(0, 5).map((defect, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-gray-900 px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          defect.severity === 'severe' ? 'bg-red-500' :
                          defect.severity === 'moderate' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                      />
                      <span className="text-xs text-gray-400">
                        Scratch at ({defect.x}, {defect.y})
                      </span>
                    </div>
                    <Badge variant={getSeverityBadgeVariant(defect.severity)} className="text-[10px]">
                      {defect.severity}
                    </Badge>
                  </div>
                ))}

                {surface.scratches.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{surface.scratches.length - 5} more defects
                  </p>
                )}
              </motion.div>
            )}
          </div>
        )}

        {scratchCount === 0 && !surface.printLines && !surface.holoDamage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400">No surface defects detected — excellent condition</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
