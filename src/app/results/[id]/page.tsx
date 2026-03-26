import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import ResultsDashboard from '@/components/dashboard/ResultsDashboard';
import type { AnalysisResult } from '@/types';

interface ResultsPageProps {
  params: { id: string };
}

async function getAnalysis(id: string): Promise<AnalysisResult | null> {
  try {
    const analysis = await prisma.cardAnalysis.findUnique({
      where: { id },
      include: {
        identification: {
          include: {
            marketData: true,
          },
        },
        gradingROI: true,
      },
    });

    if (!analysis) return null;

    const surface = analysis.surfaceData as {
      scratches?: Array<{ x: number; y: number; width: number; height: number; severity: 'minor' | 'moderate' | 'severe' }>;
      printLines?: boolean;
      holoDamage?: boolean;
    } | null;

    const gradeBreakdown = analysis.gradeBreakdown as {
      centering?: number;
      corners?: number;
      edges?: number;
      surface?: number;
    } | null;

    const marketComps = analysis.identification?.marketData?.map((md) => {
      const sales = md.recentSales as Array<{ price: number; date: string; platform: string; condition: string }>;
      return {
        grade: md.psaGrade,
        avgPrice: md.avgSalePrice,
        recentSales: sales || [],
        population: 0,
        priceRange: {
          low: Math.min(...(sales?.map((s) => s.price) || [0])),
          high: Math.max(...(sales?.map((s) => s.price) || [0])),
        },
      };
    });

    const result: AnalysisResult = {
      id: analysis.id,
      imageUrl: analysis.imageUrl,
      annotatedImageUrl: analysis.annotatedImageUrl || undefined,
      centering: {
        left: analysis.centeringLeft,
        right: analysis.centeringRight,
        top: analysis.centeringTop,
        bottom: analysis.centeringBottom,
        leftPct: (analysis.centeringLeft / (analysis.centeringLeft + analysis.centeringRight)) * 100,
        rightPct: (analysis.centeringRight / (analysis.centeringLeft + analysis.centeringRight)) * 100,
        topPct: (analysis.centeringTop / (analysis.centeringTop + analysis.centeringBottom)) * 100,
        bottomPct: (analysis.centeringBottom / (analysis.centeringTop + analysis.centeringBottom)) * 100,
        score: analysis.centeringScore,
      },
      corners: {
        frontLeft: analysis.cornerFL,
        frontRight: analysis.cornerFR,
        backLeft: analysis.cornerBL,
        backRight: analysis.cornerBR,
        overall: (analysis.cornerFL + analysis.cornerFR + analysis.cornerBL + analysis.cornerBR) / 4,
      },
      surface: {
        score: analysis.surfaceScore,
        scratches: surface?.scratches || [],
        printLines: surface?.printLines || false,
        holoDamage: surface?.holoDamage || false,
      },
      grade: {
        predictedGrade: analysis.predictedGrade,
        confidence: analysis.confidence,
        breakdown: {
          centering: gradeBreakdown?.centering || analysis.centeringScore,
          corners: gradeBreakdown?.corners || (analysis.cornerFL + analysis.cornerFR + analysis.cornerBL + analysis.cornerBR) / 4,
          edges: gradeBreakdown?.edges || 8.0,
          surface: gradeBreakdown?.surface || analysis.surfaceScore,
        },
      },
      market: marketComps && marketComps.length > 0 ? marketComps : undefined,
      roi: analysis.gradingROI
        ? {
            gradingCost: analysis.gradingROI.gradingCost,
            submissionFee: analysis.gradingROI.submissionFee,
            expectedReturnByGrade: {},
            rawValue: analysis.gradingROI.rawSalePrice,
            recommendation: analysis.gradingROI.recommendAction as 'grade' | 'sell_raw' | 'hold',
            profitPotential: analysis.gradingROI.profitPotential,
            gradeProbabilities: {},
            expectedValue: analysis.gradingROI.expectedSalePrice,
            totalCost: analysis.gradingROI.gradingCost + analysis.gradingROI.submissionFee,
          }
        : undefined,
      identification: analysis.identification
        ? {
            playerName: analysis.identification.playerName || undefined,
            year: analysis.identification.year || undefined,
            set: analysis.identification.set || undefined,
            cardNumber: analysis.identification.cardNumber || undefined,
          }
        : undefined,
    };

    return result;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const analysis = await getAnalysis(params.id);

  if (!analysis) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/analyze"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            New Analysis
          </Link>
          <div className="text-xs text-gray-600">
            Analysis ID: {analysis.id.slice(-8)}
          </div>
        </div>

        {/* Results */}
        <ResultsDashboard result={analysis} />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: ResultsPageProps) {
  const analysis = await getAnalysis(params.id);

  if (!analysis) {
    return { title: 'Analysis Not Found — CardGradeAI' };
  }

  const grade = Math.round(analysis.grade.predictedGrade);
  const player = analysis.identification?.playerName;

  return {
    title: player
      ? `${player} — PSA ${grade} Prediction | CardGradeAI`
      : `Card Analysis — PSA ${grade} Prediction | CardGradeAI`,
    description: `AI grade prediction: PSA ${grade} with ${(analysis.grade.confidence * 100).toFixed(0)}% confidence`,
  };
}
