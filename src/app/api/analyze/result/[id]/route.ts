import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const analysis = await prisma.cardAnalysis.findUnique({
      where: { id: params.id },
      include: {
        identification: { include: { marketData: true } },
        gradingROI: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

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

    const result = {
      id: analysis.id,
      imageUrl: analysis.imageUrl,
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
      market: marketComps?.length ? marketComps : undefined,
      roi: analysis.gradingROI ? {
        gradingCost: analysis.gradingROI.gradingCost,
        submissionFee: analysis.gradingROI.submissionFee,
        expectedReturnByGrade: {},
        rawValue: analysis.gradingROI.rawSalePrice,
        recommendation: analysis.gradingROI.recommendAction as 'grade' | 'sell_raw' | 'hold',
        profitPotential: analysis.gradingROI.profitPotential,
        gradeProbabilities: {},
        expectedValue: analysis.gradingROI.expectedSalePrice,
        totalCost: analysis.gradingROI.gradingCost + analysis.gradingROI.submissionFee,
      } : undefined,
      identification: analysis.identification ? {
        playerName: analysis.identification.playerName || undefined,
        year: analysis.identification.year || undefined,
        set: analysis.identification.set || undefined,
        cardNumber: analysis.identification.cardNumber || undefined,
      } : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
  }
}
