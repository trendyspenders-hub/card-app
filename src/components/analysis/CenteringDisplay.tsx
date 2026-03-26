'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CenteringResult } from '@/types';

interface CenteringDisplayProps {
  centering: CenteringResult;
}

function getCenteringGrade(score: number): { label: string; color: string; badge: 'success' | 'warning' | 'destructive' } {
  if (score >= 9.5) return { label: 'Gem Mint', color: 'text-emerald-400', badge: 'success' };
  if (score >= 8.5) return { label: 'Near Mint+', color: 'text-green-400', badge: 'success' };
  if (score >= 7.5) return { label: 'Near Mint', color: 'text-lime-400', badge: 'warning' };
  if (score >= 6.5) return { label: 'Ex-Near Mint', color: 'text-yellow-400', badge: 'warning' };
  return { label: 'Below Average', color: 'text-red-400', badge: 'destructive' };
}

function getBorderColor(pct: number): string {
  const deviation = Math.abs(pct - 50);
  if (deviation <= 5) return 'bg-emerald-500';   // 55/45 or better
  if (deviation <= 10) return 'bg-yellow-500';    // 60/40 or better
  if (deviation <= 15) return 'bg-orange-500';    // 65/35 or better
  return 'bg-red-500';
}

function getBorderTextColor(pct: number): string {
  const deviation = Math.abs(pct - 50);
  if (deviation <= 5) return 'text-emerald-400';
  if (deviation <= 10) return 'text-yellow-400';
  if (deviation <= 15) return 'text-orange-400';
  return 'text-red-400';
}

export default function CenteringDisplay({ centering }: CenteringDisplayProps) {
  const gradeInfo = getCenteringGrade(centering.score);
  const lrRatio = `${Math.round(centering.leftPct)}/${Math.round(centering.rightPct)}`;
  const tbRatio = `${Math.round(centering.topPct)}/${Math.round(centering.bottomPct)}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Centering</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={gradeInfo.badge}>{gradeInfo.label}</Badge>
            <span className={`text-2xl font-bold ${gradeInfo.color}`}>
              {centering.score.toFixed(1)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visual card representation */}
        <div className="flex justify-center mb-6">
          <div className="relative" style={{ width: 200, height: 280 }}>
            {/* Outer measurement area */}
            <div className="absolute inset-0 rounded border border-gray-700 bg-gray-800/30" />

            {/* Card inner */}
            <div
              className="absolute rounded bg-gray-700 border border-gray-600"
              style={{
                left: `${centering.leftPct * 0.7}%`,
                right: `${centering.rightPct * 0.7}%`,
                top: `${centering.topPct * 0.5}%`,
                bottom: `${centering.bottomPct * 0.5}%`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${gradeInfo.color}`}>
                    {centering.score.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">Score</div>
                </div>
              </div>
            </div>

            {/* Left measurement */}
            <div
              className={`absolute left-0 flex items-center justify-center text-[10px] font-bold ${getBorderTextColor(centering.leftPct)}`}
              style={{
                width: `${centering.leftPct * 0.7}%`,
                top: '40%',
                bottom: '40%',
              }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span>{Math.round(centering.left)}px</span>
                <div className={`h-0.5 w-full ${getBorderColor(centering.leftPct)}`} />
                <span>{Math.round(centering.leftPct)}%</span>
              </div>
            </div>

            {/* Right measurement */}
            <div
              className={`absolute right-0 flex items-center justify-center text-[10px] font-bold ${getBorderTextColor(centering.rightPct)}`}
              style={{
                width: `${centering.rightPct * 0.7}%`,
                top: '40%',
                bottom: '40%',
              }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span>{Math.round(centering.right)}px</span>
                <div className={`h-0.5 w-full ${getBorderColor(centering.rightPct)}`} />
                <span>{Math.round(centering.rightPct)}%</span>
              </div>
            </div>

            {/* Top measurement */}
            <div
              className={`absolute top-0 left-[20%] right-[20%] flex flex-col items-center justify-center text-[10px] font-bold ${getBorderTextColor(centering.topPct)}`}
              style={{ height: `${centering.topPct * 0.5}%` }}
            >
              <span>{Math.round(centering.top)}px</span>
              <div className={`h-0.5 w-full mt-0.5 ${getBorderColor(centering.topPct)}`} />
            </div>

            {/* Bottom measurement */}
            <div
              className={`absolute bottom-0 left-[20%] right-[20%] flex flex-col items-center justify-center text-[10px] font-bold ${getBorderTextColor(centering.bottomPct)}`}
              style={{ height: `${centering.bottomPct * 0.5}%` }}
            >
              <div className={`h-0.5 w-full mb-0.5 ${getBorderColor(centering.bottomPct)}`} />
              <span>{Math.round(centering.bottom)}px</span>
            </div>
          </div>
        </div>

        {/* Ratio display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Left / Right</div>
            <div className={`text-xl font-bold ${getBorderTextColor(centering.leftPct)}`}>
              {lrRatio}
            </div>
            <div className="mt-2">
              <div className="h-2 rounded-full bg-gray-700 overflow-hidden flex">
                <motion.div
                  className={`h-full ${getBorderColor(centering.leftPct)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${centering.leftPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Top / Bottom</div>
            <div className={`text-xl font-bold ${getBorderTextColor(centering.topPct)}`}>
              {tbRatio}
            </div>
            <div className="mt-2">
              <div className="h-2 rounded-full bg-gray-700 overflow-hidden flex">
                <motion.div
                  className={`h-full ${getBorderColor(centering.topPct)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${centering.topPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* PSA grading reference */}
        <div className="mt-4 rounded-lg border border-gray-800 p-3">
          <div className="text-xs text-gray-400 mb-2 font-medium">PSA Centering Standards</div>
          <div className="space-y-1">
            {[
              { label: 'PSA 10', std: '55/45 or better', color: 'text-emerald-400' },
              { label: 'PSA 9', std: '60/40 or better', color: 'text-green-400' },
              { label: 'PSA 8', std: '65/35 or better', color: 'text-yellow-400' },
              { label: 'PSA 7', std: '70/30 or better', color: 'text-orange-400' },
            ].map((ref) => (
              <div key={ref.label} className="flex justify-between text-xs">
                <span className={`font-medium ${ref.color}`}>{ref.label}</span>
                <span className="text-gray-500">{ref.std}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
