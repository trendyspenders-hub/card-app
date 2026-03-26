'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MarketComp, Sale } from '@/types';

interface MarketCompsProps {
  comps: MarketComp[];
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
  return `$${price.toLocaleString()}`;
}

function getPriceTrend(sales: Sale[]): 'up' | 'down' | 'flat' {
  if (sales.length < 2) return 'flat';
  const sorted = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const recent = sorted.slice(-3).reduce((s, sale) => s + sale.price, 0) / 3;
  const older = sorted.slice(0, 3).reduce((s, sale) => s + sale.price, 0) / 3;
  const change = (recent - older) / older;
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'flat';
}

function getGradeLabel(grade: number): string {
  if (grade === 0) return 'Raw';
  return `PSA ${grade}`;
}

function getGradeTabColor(grade: number): string {
  if (grade === 10) return 'text-emerald-400';
  if (grade === 9) return 'text-green-400';
  if (grade === 8) return 'text-lime-400';
  return 'text-gray-400';
}

interface CompDetailProps {
  comp: MarketComp;
}

function CompDetail({ comp }: CompDetailProps) {
  const trend = getPriceTrend(comp.recentSales);
  const chartData = [...comp.recentSales]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12)
    .map((s) => ({ date: s.date.slice(5), price: s.price }));

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Avg Price</div>
          <div className="text-lg font-bold text-white">{formatPrice(comp.avgPrice)}</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Low</div>
          <div className="text-lg font-bold text-white">{formatPrice(comp.priceRange.low)}</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">High</div>
          <div className="text-lg font-bold text-white">{formatPrice(comp.priceRange.high)}</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Sales</div>
          <div className="text-lg font-bold text-white flex items-center justify-center gap-1">
            {comp.recentSales.length}
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
            {trend === 'flat' && <Minus className="h-4 w-4 text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Price chart */}
      {chartData.length > 1 && (
        <div className="rounded-lg bg-gray-800 p-3">
          <div className="text-xs text-gray-400 mb-3">Price History</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatPrice(v)}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sales table */}
      <div className="rounded-lg bg-gray-800 overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-700">
          <div className="grid grid-cols-4 text-xs font-medium text-gray-400">
            <span>Date</span>
            <span>Platform</span>
            <span>Condition</span>
            <span className="text-right">Price</span>
          </div>
        </div>
        <div className="divide-y divide-gray-700/50 max-h-48 overflow-y-auto">
          {comp.recentSales.slice(0, 10).map((sale, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-4 px-3 py-2 text-xs hover:bg-gray-700/30 transition-colors"
            >
              <span className="text-gray-400">{sale.date}</span>
              <span className="text-gray-300">{sale.platform}</span>
              <span className="text-gray-400">{sale.condition}</span>
              <span className="text-right font-medium text-white">
                ${sale.price.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MarketComps({ comps }: MarketCompsProps) {
  const sortedComps = [...comps].sort((a, b) => b.grade - a.grade);
  const [activeGrade, setActiveGrade] = useState(sortedComps[0]?.grade ?? 10);
  const activeComp = sortedComps.find((c) => c.grade === activeGrade);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Market Comparables</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grade tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sortedComps.map((comp) => (
            <button
              key={comp.grade}
              onClick={() => setActiveGrade(comp.grade)}
              className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeGrade === comp.grade
                  ? `bg-gray-700 ${getGradeTabColor(comp.grade)}`
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              {getGradeLabel(comp.grade)}
              {comp.avgPrice > 0 && (
                <span className="ml-2 text-xs opacity-70">
                  {formatPrice(comp.avgPrice)}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeComp ? (
          <CompDetail comp={activeComp} />
        ) : (
          <div className="text-center text-gray-500 py-8">
            No market data available for this grade
          </div>
        )}

        <div className="text-xs text-gray-600 text-center">
          Market data sourced from eBay completed sales. Updated hourly.
        </div>
      </CardContent>
    </Card>
  );
}
