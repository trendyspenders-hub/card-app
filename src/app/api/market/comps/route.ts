import { NextRequest, NextResponse } from 'next/server';
import { getMarketComps } from '@/lib/market-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerName = searchParams.get('playerName') || '';
    const year = searchParams.get('year') || '';
    const cardSet = searchParams.get('set') || '';
    const cardNumber = searchParams.get('cardNumber') || '';

    if (!playerName && !year) {
      return NextResponse.json(
        { error: 'At least playerName or year is required' },
        { status: 400 }
      );
    }

    const comps = await getMarketComps(playerName, year, cardSet, cardNumber);

    return NextResponse.json(comps);
  } catch (error) {
    console.error('Market comps error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market comparables' },
      { status: 500 }
    );
  }
}
