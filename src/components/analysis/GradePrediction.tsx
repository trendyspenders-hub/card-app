'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { GradeResult } from '@/types';

interface GradePredictionProps {
  grade: GradeResult;
}

function getGradeColor(grade: number): string {
  if (grade >= 9.5) return 'text-emerald-400';
  if (grade >= 8.5) return 'text-green-400';
  if (grade >= 7.5) return 'text-lime-400';
  if (grade >= 6.5) return 'text-yellow-400';
  if (grade >= 5.5) return 'text-orange-400';
  return 'text-red-400';
}

function getGradeBg(grade: number): string {
  if (grade >= 9.5) return 'from-emerald-900/40 to-emerald-800/20 border-emerald-500/30';
  if (grade >= 8.5) return 'from-green-900/40 to-green-800/20 border-green-500/30';
  if (grade >= 7.5) return 'from-lime-900/40 to-lime-800/20 border-lime-500/30';
  if (grade >= 6.5) return 'from-yellow-900/40 to-yellow-800/20 border-yellow-500/30';
  return 'from-red-900/40 to-red-800/20 border-red-500/30';
}

function getGradeLabel(grade: number): string {
  if (grade === 10) return 'Gem Mint';
  if (grade >= 9.5) return 'Gem Mint';
  if (grade >= 8.5) return 'Near Mint - Mint';
  if (grade >= 7.5) return 'Near Mint';
  if (grade >= 6.5) return 'Excellent - Near Mint';
  if (grade >= 5.5) return 'Excellent';
  if (grade >= 4.5) return 'Very Good - Excellent';
  if (grade >= 3.5) return 'Very Good';
  if (grade >= 2.5) return 'Good';
  return 'Poor';
}

function getCategoryExplanation(category: string, score: number): string {
  if (category === 'centering') {
    if (score >= 9) return 'Borders are nearly equal on all sides';
    if (score >= 7) return 'Slight off-centering detected';
    return 'Noticeable centering issue';
  }
  if (category === 'corners') {
    if (score >= 9) return 'Corners are sharp with no visible wear';
    if (score >= 7) return 'Minor wear on one or more corners';
    return 'Significant corner wear detected';
  }
  if (category === 'edges') {
    if (score >= 9) return 'Edges are clean and undamaged';
    if (score >= 7) return 'Very minor nicks on edges';
    return 'Visible edge damage';
  }
  if (category === 'surface') {
    if (score >= 9) return 'Surface is clean, no scratches';
    if (score >= 7) return 'Minor surface wear or light scratches';
    return 'Scratches or print defects visible';
  }
  return '';
}

const GRADE_WEIGHTS = { centering: 25, corners: 35, edges: 20, surface: 20 };

const ALL_GRADES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function GradePrediction({ grade }: GradePredictionProps) {
  const displayGrade = Math.round(grade.predictedGrade * 2) / 2;
  const psaGrade = Math.round(grade.predictedGrade);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Grade Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main grade display */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className={`rounded-xl border bg-gradient-to-br p-6 text-center ${getGradeBg(grade.predictedGrade)}`}
        >
          <div className="text-sm font-medium text-gray-400 mb-1">PSA EQUIVALENT</div>
          <div className={`text-8xl font-black leading-none ${getGradeColor(grade.predictedGrade)}`}>
            {psaGrade}
          </div>
          <div className={`text-lg font-semibold mt-2 ${getGradeColor(grade.predictedGrade)}`}>
            {getGradeLabel(grade.predictedGrade)}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Raw score: {grade.predictedGrade.toFixed(2)}
          </div>
        </motion.div>

        {/* Confidence */}
        <div>
          <Progress
            value={grade.confidence * 100}
            label="Confidence"
            showValue
            size="md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Based on image quality and analysis clarity
          </p>
        </div>

        {/* Grade breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Grade Breakdown</h4>
          <div className="space-y-3">
            {(Object.entries(grade.breakdown) as [keyof typeof grade.breakdown, number][]).map(
              ([category, score]) => (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm capitalize text-gray-300">{category}</span>
                      <span className="text-xs text-gray-600">
                        ({GRADE_WEIGHTS[category as keyof typeof GRADE_WEIGHTS]}% weight)
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${getGradeColor(score)}`}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={score * 10} size="sm" />
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getCategoryExplanation(category, score)}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Grade scale */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Grade Scale</h4>
          <div className="grid grid-cols-10 gap-1">
            {ALL_GRADES.map((g) => {
              const isActive = g === psaGrade;
              const isClose = Math.abs(g - grade.predictedGrade) < 1;
              return (
                <motion.div
                  key={g}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: isActive ? 1.15 : 1, opacity: 1 }}
                  transition={{ delay: (10 - g) * 0.03 }}
                  className={`
                    rounded text-center py-2 text-xs font-bold transition-all
                    ${isActive
                      ? `ring-2 ring-offset-1 ring-offset-gray-900 ${getGradeColor(g)} bg-gray-800 ring-current`
                      : isClose
                      ? `${getGradeColor(g)} bg-gray-800/50`
                      : 'text-gray-600 bg-gray-800/30'
                    }
                  `}
                >
                  {g}
                </motion.div>
              );
            })}
          </div>
          <div className="grid grid-cols-10 gap-1 mt-1">
            {ALL_GRADES.map((g) => (
              <div key={g} className="text-center text-[9px] text-gray-600 truncate">
                {g === 10 ? 'Gem' : g === 9 ? 'NM-M' : g === 8 ? 'NM' : g === 7 ? 'Ex+' : g === 6 ? 'Ex' : g === 5 ? 'VG+' : g === 4 ? 'VG' : g === 3 ? 'G' : g === 2 ? 'Fr' : 'Pr'}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
