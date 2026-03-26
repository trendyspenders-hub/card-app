import { NextRequest, NextResponse } from 'next/server';
import { calculateROI } from '@/lib/market-data';
import type { GradingService } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      comps,
      gradingService = 'PSA',
      tier = 'regular',
      predictedGrade = 8,
      confidence = 0.75,
    } = body;

    if (!comps || !Array.isArray(comps)) {
      return NextResponse.json(
        { error: 'comps array is required' },
        { status: 400 }
      );
    }

    const validServices: GradingService[] = ['PSA', 'BGS', 'SGC'];
    if (!validServices.includes(gradingService)) {
      return NextResponse.json(
        { error: `Invalid grading service. Must be one of: ${validServices.join(', ')}` },
        { status: 400 }
      );
    }

    const roi = calculateROI(comps, gradingService as GradingService, tier, predictedGrade, confidence);

    return NextResponse.json(roi);
  } catch (error) {
    console.error('ROI calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ROI' },
      { status: 500 }
    );
  }
}
