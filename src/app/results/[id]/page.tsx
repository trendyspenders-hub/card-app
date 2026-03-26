'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ResultsDashboard from '@/components/dashboard/ResultsDashboard';
import type { AnalysisResult } from '@/types';

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Check sessionStorage first (populated immediately after analysis)
    const cached = sessionStorage.getItem(`analysis_${id}`);
    if (cached) {
      try {
        setResult(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        // fall through to API fetch
      }
    }

    // Fallback: fetch from DB via API
    fetch(`/api/analyze/result/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-gray-700 border-t-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-400 text-center">This analysis was not found. It may have expired.</p>
        <Link
          href="/analyze"
          className="flex items-center gap-2 text-sm text-[var(--gold)] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" />
          Analyze a new card
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/analyze"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            New Analysis
          </Link>
          <div className="text-xs text-gray-600">
            Analysis ID: {result.id.slice(-8)}
          </div>
        </div>

        <ResultsDashboard result={result} />
      </div>
    </div>
  );
}
