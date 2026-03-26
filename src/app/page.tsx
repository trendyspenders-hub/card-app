import Link from 'next/link';
import { ArrowRight, Zap, BarChart2, TrendingUp, Camera, Brain, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-indigo-950/40 via-gray-950 to-gray-950" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03]" />

        <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-8">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Grading Analysis
          </div>

          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            Know Before You{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Grade
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-gray-400 mb-10 leading-relaxed">
            Upload your sports card and get instant AI-powered grade prediction, real market
            comparables, and ROI analysis — before spending money on PSA or BGS submission.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" className="gap-2 text-base px-8">
                Analyze My Card
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="text-base px-8">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Hero stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto border-t border-gray-800 pt-10">
            {[
              { value: '92%', label: 'Grade accuracy' },
              { value: '$0', label: 'Cost to analyze' },
              { value: '< 30s', label: 'Analysis time' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-black text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-20 border-t border-gray-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Everything you need to make smart grading decisions
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Our AI analyzes your card the same way professional graders do — centering,
              corners, edges, and surface — then gives you the data to act on.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/10 border-indigo-500/20',
                title: 'AI Grading Analysis',
                desc: 'Computer vision analysis of centering, all 4 corners, edges, and surface condition. Get a predicted PSA/BGS grade with confidence score.',
                items: ['Centering measurement', '4-corner scoring', 'Surface defect detection', 'Print line detection'],
              },
              {
                icon: BarChart2,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
                title: 'Real Market Comps',
                desc: 'See actual sold prices for PSA 9, PSA 10, and raw versions of your card. Live data from eBay, PWCC, and Goldin.',
                items: ['Recent sale prices', 'Price range & average', 'Population reports', 'Price trend charts'],
              },
              {
                icon: TrendingUp,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10 border-purple-500/20',
                title: 'ROI Calculator',
                desc: 'Should you grade or sell raw? Our calculator factors in grading fees, expected grade outcome, and market prices to give you a clear answer.',
                items: ['Profit potential', 'Grade probability', 'Expected value calc', 'Submit vs. sell raw'],
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`rounded-xl border p-6 ${feature.bg} card-hover`}
              >
                <feature.icon className={`h-8 w-8 ${feature.color} mb-4`} />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{feature.desc}</p>
                <ul className="space-y-1.5">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className={`h-3.5 w-3.5 ${feature.color} flex-shrink-0`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 border-t border-gray-800 bg-gray-900/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-gray-400">Three steps to a smarter grading decision</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Camera,
                title: 'Upload Your Card',
                desc: 'Take a photo or upload an image of your card. Front view required; back optional. Works with any smartphone camera.',
              },
              {
                step: '02',
                icon: Brain,
                title: 'AI Analyzes It',
                desc: 'Our computer vision model checks centering to the pixel, scores all four corners, and scans the surface for scratches and defects.',
              },
              {
                step: '03',
                icon: DollarSign,
                title: 'Get Your Report',
                desc: 'Receive a full analysis with predicted grade, real market prices, and a clear recommendation: submit to PSA, BGS, SGC, or sell raw.',
              },
            ].map((step, i) => (
              <div key={step.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-700 to-transparent -translate-y-1/2 z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800 border border-gray-700">
                      <step.icon className="h-7 w-7 text-indigo-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-gray-800">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stop guessing. Start knowing.
          </h2>
          <p className="text-gray-400 mb-8">
            PSA submission fees aren't cheap. One free analysis could save you $25–$300
            in grading fees on cards that won't grade high enough to be worth it.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="text-base px-10 gap-2">
              Analyze Your Card Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-600 p-1">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">
                CardGrade<span className="text-indigo-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Grade predictions are estimates only. Always verify with professional graders.
              Market data sourced from public eBay sold listings.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
