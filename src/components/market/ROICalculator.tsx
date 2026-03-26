'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ROIAnalysis, GradeResult, MarketComp, GradingService, GradingTier } from '@/types';

interface ROICalculatorProps {
  roi: ROIAnalysis;
  grade: GradeResult;
  comps: MarketComp[];
}

const GRADING_COSTS: Record<GradingService, Record<GradingTier, { cost: number; turnaround: string }>> = {
  PSA: {
    regular: { cost: 25, turnaround: '45–90 days' },
    express: { cost: 75, turnaround: '10–20 days' },
    walkthrough: { cost: 300, turnaround: 'Same day' },
  },
  BGS: {
    regular: { cost: 22, turnaround: '30–60 days' },
    express: { cost: 68, turnaround: '10–15 days' },
    walkthrough: { cost: 250, turnaround: 'Same day' },
  },
  SGC: {
    regular: { cost: 18, turnaround: '20–45 days' },
    express: { cost: 55, turnaround: '7–10 days' },
    walkthrough: { cost: 200, turnaround: 'Same day' },
  },
};

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export default function ROICalculator({ roi, grade, comps }: ROICalculatorProps) {
  const [service, setService] = useState<GradingService>('PSA');
  const [tier, setTier] = useState<GradingTier>('regular');
  const [shippingCost, setShippingCost] = useState(15);
  const [calculatedROI, setCalculatedROI] = useState<ROIAnalysis>(roi);

  const selectedCost = GRADING_COSTS[service][tier].cost;
  const totalCost = selectedCost + shippingCost;

  useEffect(() => {
    async function recalculate() {
      try {
        const res = await fetch('/api/market/roi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comps,
            gradingService: service,
            tier,
            predictedGrade: grade.predictedGrade,
            confidence: grade.confidence,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setCalculatedROI(data);
        }
      } catch {
        // keep previous ROI
      }
    }
    recalculate();
  }, [service, tier, comps, grade]);

  const netProfit = (calculatedROI.expectedValue || 0) - totalCost - (calculatedROI.rawValue || 0);
  const isWorthGrading = calculatedROI.recommendation === 'grade';

  const gradeProbData = Object.entries(calculatedROI.gradeProbabilities || {})
    .map(([g, prob]) => ({
      grade: `PSA ${g}`,
      probability: Math.round(prob * 100),
      price: calculatedROI.expectedReturnByGrade?.[parseInt(g)] || 0,
    }))
    .sort((a, b) => parseInt(b.grade.replace('PSA ', '')) - parseInt(a.grade.replace('PSA ', '')));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>ROI Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Service selector */}
        <div className="grid grid-cols-3 gap-2">
          {(['PSA', 'BGS', 'SGC'] as GradingService[]).map((s) => (
            <button
              key={s}
              onClick={() => setService(s)}
              className={`rounded-lg border py-2 text-sm font-medium transition-all ${
                service === s
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Tier selector */}
        <div>
          <div className="text-xs text-gray-400 mb-2">Submission Tier</div>
          <div className="space-y-2">
            {(Object.entries(GRADING_COSTS[service]) as [GradingTier, { cost: number; turnaround: string }][]).map(
              ([t, info]) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`w-full rounded-lg border p-2 text-left transition-all ${
                    tier === t
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium capitalize text-white">{t}</span>
                      <span className="ml-2 text-xs text-gray-500">{info.turnaround}</span>
                    </div>
                    <span className="text-sm font-bold text-white">${info.cost}</span>
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Shipping cost */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Estimated Shipping</span>
            <span>${shippingCost}</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={shippingCost}
            onChange={(e) => setShippingCost(parseInt(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>$5</span>
            <span>$50</span>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 divide-y divide-gray-700">
          {[
            { label: `${service} ${tier} grading`, icon: Package, value: selectedCost },
            { label: 'Shipping (est.)', icon: DollarSign, value: shippingCost },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <row.icon className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm text-gray-300">{row.label}</span>
              </div>
              <span className="text-sm text-white">{formatCurrency(row.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-bold text-white">Total Cost</span>
            <span className="text-sm font-bold text-white">{formatCurrency(totalCost)}</span>
          </div>
        </div>

        {/* Financial summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Raw Value</div>
            <div className="text-base font-bold text-white">
              {formatCurrency(calculatedROI.rawValue || 0)}
            </div>
          </div>
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Expected Sale</div>
            <div className="text-base font-bold text-green-400">
              {formatCurrency(calculatedROI.expectedValue || 0)}
            </div>
          </div>
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Net Profit</div>
            <div className={`text-base font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
            </div>
          </div>
        </div>

        {/* Grade probability chart */}
        {gradeProbData.length > 0 && (
          <div className="rounded-lg bg-gray-800 p-3">
            <div className="text-xs text-gray-400 mb-3">Grade Probability</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={gradeProbData} barSize={28}>
                <XAxis
                  dataKey="grade"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(v: number, name: string) => [
                    name === 'probability' ? `${v}%` : formatCurrency(v),
                    name === 'probability' ? 'Probability' : 'Avg Price',
                  ]}
                />
                <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                  {gradeProbData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.grade.includes('10') ? '#10b981' :
                        entry.grade.includes('9') ? '#22c55e' :
                        entry.grade.includes('8') ? '#84cc16' : '#eab308'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expected value calculation */}
        <div className="rounded-lg border border-gray-700 p-3 text-xs text-gray-400 space-y-1">
          <div className="font-medium text-gray-300 mb-2 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Expected Value Calculation
          </div>
          {gradeProbData.map((d) => (
            <div key={d.grade} className="flex justify-between">
              <span>{d.grade}: {d.probability}% × {formatCurrency(d.price)}</span>
              <span className="text-gray-300">= {formatCurrency(d.probability / 100 * d.price)}</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-1 flex justify-between font-medium text-gray-200">
            <span>Total Expected Value</span>
            <span>{formatCurrency(calculatedROI.expectedValue || 0)}</span>
          </div>
        </div>

        {/* Recommendation */}
        <motion.div
          key={isWorthGrading ? 'grade' : 'sell'}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {isWorthGrading ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-lg font-black text-emerald-400 tracking-wide">
                WORTH GRADING
              </div>
              <p className="text-sm text-emerald-300 mt-1">
                Expected profit of {formatCurrency(netProfit)} after costs
              </p>
              <Button className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500" size="lg">
                Submit to {service}
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <div className="text-lg font-black text-orange-400 tracking-wide">
                SELL RAW
              </div>
              <p className="text-sm text-orange-300 mt-1">
                Grading costs may exceed expected returns
              </p>
              <Button variant="outline" className="mt-3 w-full border-orange-500/40 text-orange-400" size="lg">
                List on eBay Raw
              </Button>
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
