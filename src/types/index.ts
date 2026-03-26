export interface CenteringResult {
  left: number;
  right: number;
  top: number;
  bottom: number;
  leftPct: number;
  rightPct: number;
  topPct: number;
  bottomPct: number;
  score: number;
}

export interface CornerResult {
  frontLeft: number;
  frontRight: number;
  backLeft: number;
  backRight: number;
  overall: number;
}

export interface Defect {
  x: number;
  y: number;
  width: number;
  height: number;
  severity: 'minor' | 'moderate' | 'severe';
}

export interface SurfaceResult {
  score: number;
  scratches: Defect[];
  printLines: boolean;
  holoDamage: boolean;
}

export interface GradeBreakdown {
  centering: number;
  corners: number;
  edges: number;
  surface: number;
}

export interface GradeResult {
  predictedGrade: number;
  confidence: number;
  breakdown: GradeBreakdown;
}

export interface Sale {
  price: number;
  date: string;
  platform: string;
  condition: string;
}

export interface MarketComp {
  grade: number;
  avgPrice: number;
  recentSales: Sale[];
  population: number;
  priceRange: { low: number; high: number };
}

export interface ROIAnalysis {
  gradingCost: number;
  submissionFee: number;
  expectedReturnByGrade: Record<number, number>;
  rawValue: number;
  recommendation: 'grade' | 'sell_raw' | 'hold';
  profitPotential: number;
  gradeProbabilities: Record<number, number>;
  expectedValue: number;
  totalCost: number;
}

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  annotatedImageUrl?: string;
  centering: CenteringResult;
  corners: CornerResult;
  surface: SurfaceResult;
  grade: GradeResult;
  market?: MarketComp[];
  roi?: ROIAnalysis;
  identification?: {
    playerName?: string;
    year?: string;
    set?: string;
    cardNumber?: string;
    variation?: string;
    sport?: string;
  };
}

export type GradingService = 'PSA' | 'BGS' | 'SGC';

export type GradingTier = 'regular' | 'express' | 'walkthrough';

export interface GradingServiceCost {
  service: GradingService;
  tier: GradingTier;
  cost: number;
  turnaround: string;
}
