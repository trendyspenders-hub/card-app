import { getOrSet } from '@/lib/redis';
import type { MarketComp, ROIAnalysis, Sale, GradingService } from '@/types';

const GRADING_COSTS: Record<GradingService, Record<string, { cost: number; fee: number }>> = {
  PSA: {
    regular: { cost: 25, fee: 0 },
    express: { cost: 75, fee: 0 },
    walkthrough: { cost: 300, fee: 0 },
  },
  BGS: {
    regular: { cost: 22, fee: 0 },
    express: { cost: 68, fee: 0 },
    walkthrough: { cost: 250, fee: 0 },
  },
  SGC: {
    regular: { cost: 18, fee: 0 },
    express: { cost: 55, fee: 0 },
    walkthrough: { cost: 200, fee: 0 },
  },
};

function generateMockSales(basePrice: number, count: number = 8): Sale[] {
  const platforms = ['eBay', 'PWCC', 'Goldin', '130Point', 'eBay BIN'];
  const conditions = ['Excellent', 'Near Mint', 'Mint'];
  const sales: Sale[] = [];

  for (let i = 0; i < count; i++) {
    const variance = (Math.random() - 0.5) * 0.3;
    const price = Math.round(basePrice * (1 + variance) * 100) / 100;
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    sales.push({
      price,
      date: date.toISOString().split('T')[0],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      condition: conditions[Math.floor(Math.random() * conditions.length)],
    });
  }

  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateMockComps(
  playerName: string,
  year: string,
  cardSet: string
): MarketComp[] {
  const isRookie = cardSet?.toLowerCase().includes('rookie') || cardSet?.toLowerCase().includes('rc');
  const baseMultiplier = isRookie ? 3 : 1;

  const grade10Base = 150 * baseMultiplier + Math.random() * 50;
  const grade9Base = grade10Base * 0.55;
  const grade8Base = grade10Base * 0.3;
  const rawBase = grade10Base * 0.15;

  return [
    {
      grade: 10,
      avgPrice: Math.round(grade10Base),
      recentSales: generateMockSales(grade10Base),
      population: Math.floor(50 + Math.random() * 200),
      priceRange: {
        low: Math.round(grade10Base * 0.75),
        high: Math.round(grade10Base * 1.35),
      },
    },
    {
      grade: 9,
      avgPrice: Math.round(grade9Base),
      recentSales: generateMockSales(grade9Base),
      population: Math.floor(150 + Math.random() * 500),
      priceRange: {
        low: Math.round(grade9Base * 0.75),
        high: Math.round(grade9Base * 1.35),
      },
    },
    {
      grade: 8,
      avgPrice: Math.round(grade8Base),
      recentSales: generateMockSales(grade8Base, 5),
      population: Math.floor(100 + Math.random() * 300),
      priceRange: {
        low: Math.round(grade8Base * 0.75),
        high: Math.round(grade8Base * 1.35),
      },
    },
    {
      grade: 0,
      avgPrice: Math.round(rawBase),
      recentSales: generateMockSales(rawBase, 10),
      population: 0,
      priceRange: {
        low: Math.round(rawBase * 0.5),
        high: Math.round(rawBase * 2),
      },
    },
  ];
}

export async function getMarketComps(
  playerName: string,
  year: string,
  cardSet: string,
  cardNumber: string
): Promise<MarketComp[]> {
  const cacheKey = `market:${playerName}:${year}:${cardSet}:${cardNumber}`.toLowerCase().replace(/\s+/g, '-');

  return getOrSet(
    cacheKey,
    async () => {
      if (process.env.EBAY_APP_ID) {
        try {
          return await fetchEbayComps(playerName, year, cardSet, cardNumber);
        } catch (err) {
          console.error('eBay API error, falling back to mock data:', err);
        }
      }
      return generateMockComps(playerName, year, cardSet);
    },
    3600
  );
}

async function fetchEbayComps(
  playerName: string,
  year: string,
  cardSet: string,
  cardNumber: string
): Promise<MarketComp[]> {
  const query = `${year} ${playerName} ${cardSet} ${cardNumber} PSA`.trim();
  const encodedQuery = encodeURIComponent(query);

  const response = await fetch(
    `https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findCompletedItems&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=${process.env.EBAY_APP_ID}&RESPONSE-DATA-FORMAT=JSON&keywords=${encodedQuery}&categoryId=214&itemFilter(0).name=SoldItemsOnly&itemFilter(0).value=true&paginationInput.entriesPerPage=50`
  );

  if (!response.ok) {
    throw new Error(`eBay API returned ${response.status}`);
  }

  const data = await response.json();
  const items = data?.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];

  const gradeMap: Record<number, Sale[]> = { 10: [], 9: [], 8: [], 0: [] };

  for (const item of items) {
    const title: string = item.title?.[0] || '';
    const price = parseFloat(item.sellingStatus?.[0]?.convertedCurrentPrice?.[0]?.__value__ || '0');
    const date = item.listingInfo?.[0]?.endTime?.[0] || new Date().toISOString();

    let grade = 0;
    if (/PSA\s*10/i.test(title)) grade = 10;
    else if (/PSA\s*9/i.test(title)) grade = 9;
    else if (/PSA\s*8/i.test(title)) grade = 8;

    gradeMap[grade].push({
      price,
      date: date.split('T')[0],
      platform: 'eBay',
      condition: grade === 0 ? 'Raw' : `PSA ${grade}`,
    });
  }

  return Object.entries(gradeMap).map(([gradeStr, sales]) => {
    const grade = parseInt(gradeStr);
    const prices = sales.map((s) => s.price).filter((p) => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    return {
      grade,
      avgPrice: Math.round(avgPrice),
      recentSales: sales.slice(0, 10),
      population: sales.length,
      priceRange: {
        low: prices.length > 0 ? Math.min(...prices) : 0,
        high: prices.length > 0 ? Math.max(...prices) : 0,
      },
    };
  });
}

export function calculateROI(
  comps: MarketComp[],
  gradingService: GradingService = 'PSA',
  tier: string = 'regular',
  predictedGrade: number = 8,
  confidence: number = 0.75
): ROIAnalysis {
  const costs = GRADING_COSTS[gradingService]?.[tier] || GRADING_COSTS.PSA.regular;
  const gradingCost = costs.cost;
  const submissionFee = costs.fee;
  const totalCost = gradingCost + submissionFee + 15; // $15 shipping estimate

  const rawComp = comps.find((c) => c.grade === 0);
  const rawValue = rawComp?.avgPrice || 0;

  const expectedReturnByGrade: Record<number, number> = {};
  for (const comp of comps) {
    if (comp.grade > 0) {
      expectedReturnByGrade[comp.grade] = comp.avgPrice;
    }
  }

  const gradeProbabilities: Record<number, number> = {};
  const grade = Math.round(predictedGrade);

  if (grade >= 9.5) {
    gradeProbabilities[10] = 0.55 * confidence;
    gradeProbabilities[9] = 0.35 * confidence;
    gradeProbabilities[8] = 0.1 * confidence;
  } else if (grade >= 8.5) {
    gradeProbabilities[10] = 0.15 * confidence;
    gradeProbabilities[9] = 0.55 * confidence;
    gradeProbabilities[8] = 0.25 * confidence;
    gradeProbabilities[7] = 0.05 * confidence;
  } else if (grade >= 7.5) {
    gradeProbabilities[10] = 0.05;
    gradeProbabilities[9] = 0.2 * confidence;
    gradeProbabilities[8] = 0.5 * confidence;
    gradeProbabilities[7] = 0.25 * confidence;
  } else {
    gradeProbabilities[8] = 0.2;
    gradeProbabilities[7] = 0.4;
    gradeProbabilities[6] = 0.4;
  }

  let expectedValue = 0;
  for (const [gradeStr, probability] of Object.entries(gradeProbabilities)) {
    const g = parseInt(gradeStr);
    const price = expectedReturnByGrade[g] || rawValue * 0.8;
    expectedValue += probability * price;
  }

  const profitPotential = expectedValue - totalCost - rawValue;

  let recommendation: 'grade' | 'sell_raw' | 'hold';
  if (profitPotential > 20 && expectedValue > totalCost * 1.5) {
    recommendation = 'grade';
  } else if (rawValue > expectedValue - totalCost) {
    recommendation = 'sell_raw';
  } else {
    recommendation = 'hold';
  }

  return {
    gradingCost,
    submissionFee,
    expectedReturnByGrade,
    rawValue,
    recommendation,
    profitPotential,
    gradeProbabilities,
    expectedValue: Math.round(expectedValue),
    totalCost,
  };
}
