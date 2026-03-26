'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import CardUploader from '@/components/upload/CardUploader';
import type { AnalysisResult } from '@/types';

export default function AnalyzePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [year, setYear] = useState('');
  const [cardSet, setCardSet] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  const handleAnalysisComplete = (result: AnalysisResult) => {
    // Store result in sessionStorage so the results page can access it
    sessionStorage.setItem(`analysis_${result.id}`, JSON.stringify(result));
    router.push(`/results/${result.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Analyze Your Card</h1>
          <p className="text-gray-400">
            Upload a clear photo of your card front for the most accurate analysis
          </p>
        </motion.div>

        {/* Card info form (optional) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-medium text-white">Card Information</h2>
            <span className="text-xs text-gray-500">(optional — enables market comps)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-gray-400 mb-1">Player Name</label>
              <input
                type="text"
                placeholder="e.g. Mike Trout"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-gray-400 mb-1">Year</label>
              <input
                type="text"
                placeholder="e.g. 2011"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-gray-400 mb-1">Set / Brand</label>
              <input
                type="text"
                placeholder="e.g. Topps Update"
                value={cardSet}
                onChange={(e) => setCardSet(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-gray-400 mb-1">Card Number</label>
              <input
                type="text"
                placeholder="e.g. US175"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Uploader */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CardUploader
            onAnalysisComplete={handleAnalysisComplete}
            playerName={playerName}
            year={year}
            cardSet={cardSet}
            cardNumber={cardNumber}
          />
        </motion.div>

        {/* Photography tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-3">Tips for Best Results</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Good Lighting',
                desc: 'Use natural light or indirect lighting. Avoid direct flash which causes glare on foil cards.',
              },
              {
                title: 'Flat Surface',
                desc: 'Place card on a flat, dark surface. Avoid white backgrounds that can interfere with edge detection.',
              },
              {
                title: 'Fill the Frame',
                desc: 'Get close enough so the card fills most of the frame. Leave a small border around all sides.',
              },
              {
                title: 'In Focus',
                desc: 'Tap the card in your camera app to focus. Blurry corners will affect corner analysis accuracy.',
              },
            ].map((tip) => (
              <div key={tip.title} className="flex gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-gray-300">{tip.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{tip.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
