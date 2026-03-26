'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, RefreshCcw, Send, ShoppingCart, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnnotatedImage from './AnnotatedImage';
import CenteringDisplay from '@/components/analysis/CenteringDisplay';
import CornerScores from '@/components/analysis/CornerScores';
import SurfaceAnalysis from '@/components/analysis/SurfaceAnalysis';
import GradePrediction from '@/components/analysis/GradePrediction';
import MarketComps from '@/components/market/MarketComps';
import ROICalculator from '@/components/market/ROICalculator';
import type { AnalysisResult } from '@/types';

interface ResultsDashboardProps {
  result: AnalysisResult;
}

type Tab = 'analysis' | 'market' | 'roi';

function getGradeColor(grade: number): string {
  if (grade >= 9.5) return 'text-emerald-400';
  if (grade >= 8.5) return 'text-green-400';
  if (grade >= 7.5) return 'text-lime-400';
  if (grade >= 6.5) return 'text-yellow-400';
  return 'text-red-400';
}

function getGradeBg(grade: number): string {
  if (grade >= 9.5) return 'from-emerald-900/20 to-transparent';
  if (grade >= 8.5) return 'from-green-900/20 to-transparent';
  if (grade >= 7.5) return 'from-lime-900/20 to-transparent';
  if (grade >= 6.5) return 'from-yellow-900/20 to-transparent';
  return 'from-red-900/20 to-transparent';
}

function getRecommendationLabel(rec?: string): string {
  if (rec === 'grade') return 'Worth Grading';
  if (rec === 'sell_raw') return 'Sell Raw';
  return 'Hold';
}

function getRecommendationVariant(rec?: string): 'success' | 'warning' | 'secondary' {
  if (rec === 'grade') return 'success';
  if (rec === 'sell_raw') return 'warning';
  return 'secondary';
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [saved, setSaved] = useState(false);
  const psaGrade = Math.round(result.grade.predictedGrade);
  const recommendation = result.roi?.recommendation;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch {
      // fallback
    }
  };

  const handleSave = async () => {
    setSaved(true);
    // In a real app this would persist to user's collection
  };

  const psaSubmitUrl = `https://www.psacard.com/myaccount/submissions`;
  const ebaySearchUrl = result.identification?.playerName
    ? `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(
        `${result.identification.year} ${result.identification.playerName} ${result.identification.set} ${result.identification.cardNumber}`
      )}`
    : 'https://www.ebay.com';

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border border-gray-800 bg-gradient-to-r ${getGradeBg(result.grade.predictedGrade)} p-4`}
      >
        <div className="flex items-center gap-6">
          {/* Mini image */}
          <div className="flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
            <img
              src={result.imageUrl}
              alt="Card"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Grade + info */}
          <div className="flex-1 min-w-0">
            {result.identification?.playerName && (
              <div className="text-sm text-gray-400 mb-1">
                {result.identification.year} {result.identification.playerName}
                {result.identification.set && ` — ${result.identification.set}`}
                {result.identification.cardNumber && ` #${result.identification.cardNumber}`}
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className={`text-5xl font-black ${getGradeColor(result.grade.predictedGrade)}`}>
                {psaGrade}
              </span>
              <div>
                <div className="text-xs text-gray-400">PSA Equivalent</div>
                <div className="text-sm font-medium text-white">
                  {(result.grade.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation + actions */}
          <div className="flex-shrink-0 text-right space-y-2">
            <div>
              <Badge variant={getRecommendationVariant(recommendation)}>
                {getRecommendationLabel(recommendation)}
              </Badge>
            </div>
            {result.roi && (
              <div className="text-xs text-gray-400">
                {result.roi.recommendation === 'grade'
                  ? `+$${Math.round(result.roi.profitPotential)} potential profit`
                  : `Raw value ~$${result.roi.rawValue}`}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className={saved ? 'text-indigo-400' : ''}
              >
                <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Annotated image */}
      <AnnotatedImage
        imageUrl={result.imageUrl}
        annotatedImageUrl={result.annotatedImageUrl}
        centering={result.centering}
        corners={result.corners}
        surface={result.surface}
      />

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl bg-gray-900 border border-gray-800 p-1">
        {([
          { id: 'analysis' as Tab, label: 'Analysis' },
          { id: 'market' as Tab, label: 'Market', disabled: !result.market },
          { id: 'roi' as Tab, label: 'ROI', disabled: !result.roi },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gray-700 text-white shadow-sm'
                : tab.disabled
                ? 'text-gray-700 cursor-not-allowed'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.disabled && (
              <span className="ml-1 text-xs text-gray-700">(identify card first)</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CenteringDisplay centering={result.centering} />
            <CornerScores corners={result.corners} imageUrl={result.imageUrl} />
            <SurfaceAnalysis surface={result.surface} />
            <GradePrediction grade={result.grade} />
          </div>
        )}

        {activeTab === 'market' && result.market && (
          <MarketComps comps={result.market} />
        )}

        {activeTab === 'roi' && result.roi && result.market && (
          <ROICalculator
            roi={result.roi}
            grade={result.grade}
            comps={result.market}
          />
        )}
      </motion.div>

      {/* Bottom action bar */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <a
          href={psaSubmitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button className="w-full bg-blue-600 hover:bg-blue-500" size="md">
            <Send className="h-4 w-4" />
            Submit to PSA
          </Button>
        </a>
        <a
          href={ebaySearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button variant="outline" className="w-full" size="md">
            <ShoppingCart className="h-4 w-4" />
            Sell Raw on eBay
          </Button>
        </a>
        <Button
          variant="ghost"
          size="md"
          onClick={handleSave}
          className={`flex-1 ${saved ? 'text-indigo-400' : ''}`}
        >
          <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          {saved ? 'Saved' : 'Save Analysis'}
        </Button>
        <a href="/analyze">
          <Button variant="ghost" size="md">
            <RefreshCcw className="h-4 w-4" />
            New Analysis
          </Button>
        </a>
      </div>
    </div>
  );
}
