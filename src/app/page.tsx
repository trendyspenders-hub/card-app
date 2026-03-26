'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function HomePage() {
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">

      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-32 pb-24 text-center overflow-hidden">

        {/* Eyebrow */}
        <div className="reveal inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#C9A84C]">
            AI-Powered Grading Analysis
          </span>
        </div>

        {/* Headline */}
        <h1 className="reveal delay-1 serif text-5xl sm:text-7xl lg:text-8xl font-normal text-white leading-[1.05] max-w-4xl mb-6">
          Know Before<br />
          <em className="gold-text not-italic">You Grade</em>
        </h1>

        <p className="reveal delay-2 max-w-xl text-[17px] text-white/40 leading-relaxed mb-12 font-light">
          Upload your card and get an instant AI-predicted grade, live market
          comparables, and a clear ROI answer — before you spend a dollar on PSA or BGS.
        </p>

        {/* CTA buttons */}
        <div className="reveal delay-3 flex flex-col sm:flex-row gap-3 items-center">
          <Link href="/analyze">
            <button
              className="group relative flex items-center gap-3 rounded-full pl-6 pr-2 py-2 text-[15px] font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', color: '#050505' }}
            >
              Analyze My Card
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
          </Link>
          <a href="#how-it-works">
            <button className="flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium text-white/50 hover:text-white transition-colors duration-500">
              See how it works
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2l4 4-4 4M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </a>
        </div>

        {/* Stats row */}
        <div className="reveal delay-4 mt-20 flex flex-col sm:flex-row gap-px w-full max-w-lg">
          {[
            { value: '92%', label: 'Grade accuracy' },
            { value: 'Free', label: 'Always' },
            { value: '<30s', label: 'Analysis time' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex-1 py-6 px-4 text-center"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: i === 0 ? '1rem 0 0 1rem' : i === 2 ? '0 1rem 1rem 0' : '0',
              }}
            >
              <div className="text-2xl font-bold gold-text mb-1">{stat.value}</div>
              <div className="text-[12px] text-white/30 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[10px] uppercase tracking-[0.25em] text-white">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ─── GOLD DIVIDER ───────────────────────────────────────────── */}
      <div className="gold-line mx-8 sm:mx-16" />

      {/* ─── FEATURE BENTO ──────────────────────────────────────────── */}
      <section className="py-32 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <div className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">The Platform</span>
            </div>
            <h2 className="serif text-4xl sm:text-5xl font-normal text-white mb-4">
              Everything graders use.<br />
              <em className="gold-text not-italic">Now in your pocket.</em>
            </h2>
            <p className="text-white/35 max-w-md mx-auto font-light leading-relaxed">
              Our AI replicates the exact criteria PSA, BGS, and SGC use to grade your cards.
            </p>
          </div>

          {/* Asymmetric bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Large card — AI grading */}
            <div className="reveal md:col-span-7 bezel-outer bezel-gold">
              <div className="bezel-inner p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="7" stroke="#C9A84C" strokeWidth="1.2"/>
                      <path d="M6 9l2 2 4-4" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[#C9A84C]">AI Analysis</span>
                </div>
                <h3 className="serif text-3xl font-normal text-white mb-3">
                  Grade prediction<br />with confidence.
                </h3>
                <p className="text-white/40 leading-relaxed mb-8 font-light">
                  Computer vision measures centering to the pixel, scores all four corners individually, and scans for surface scratches, print lines, and holo damage.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['Centering measurement', '4-corner scoring', 'Surface defect scan', 'PSA/BGS/SGC scale'].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-[13px] text-white/50">
                      <span className="w-1 h-1 rounded-full bg-[#C9A84C] flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column — stacked */}
            <div className="md:col-span-5 flex flex-col gap-4">

              {/* Market comps */}
              <div className="reveal delay-1 bezel-outer flex-1">
                <div className="bezel-inner p-6 h-full">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="7" width="2.5" height="6" rx="0.5" fill="rgba(255,255,255,0.4)"/>
                      <rect x="5.5" y="4" width="2.5" height="9" rx="0.5" fill="rgba(255,255,255,0.6)"/>
                      <rect x="10" y="1" width="2.5" height="12" rx="0.5" fill="white"/>
                    </svg>
                  </div>
                  <h3 className="text-[17px] font-semibold text-white mb-2">Live Market Comps</h3>
                  <p className="text-[13px] text-white/35 leading-relaxed font-light">
                    Real sold prices for PSA 9, PSA 10, and raw — updated from eBay sold listings.
                  </p>
                </div>
              </div>

              {/* ROI Calculator */}
              <div className="reveal delay-2 bezel-outer flex-1">
                <div className="bezel-inner p-6 h-full">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 10L5 6l3 3 5-6" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-[17px] font-semibold text-white mb-2">ROI Calculator</h3>
                  <p className="text-[13px] text-white/35 leading-relaxed font-light">
                    Grade or sell raw? Get a clear profit/loss answer factoring in all fees and grade probability.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Process</span>
            </div>
            <h2 className="serif text-4xl sm:text-5xl font-normal text-white">
              Three steps.<br />
              <em className="not-italic text-white/40">One clear answer.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: '01',
                title: 'Upload Your Card',
                desc: 'Photograph or upload your card. Works with any smartphone camera. Front view required, back optional.',
              },
              {
                num: '02',
                title: 'AI Analyzes It',
                desc: 'YOLOv8 + OpenCV measures every pixel. Centering, corners, edges, surface — the same criteria graders use.',
              },
              {
                num: '03',
                title: 'Get Your Report',
                desc: 'Predicted grade, real market prices, and a clear recommendation: submit to PSA, BGS, SGC — or sell raw.',
              },
            ].map((step, i) => (
              <div key={step.num} className={`reveal delay-${i + 1} bezel-outer`}>
                <div className="bezel-inner p-8">
                  <div className="serif text-5xl font-normal mb-6"
                    style={{ color: 'rgba(201,168,76,0.25)' }}>
                    {step.num}
                  </div>
                  <h3 className="text-[17px] font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-[13px] text-white/35 leading-relaxed font-light">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GOLD DIVIDER ───────────────────────────────────────────── */}
      <div className="gold-line mx-8 sm:mx-16" />

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="py-40 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-8"
              style={{ border: '1px solid rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.06)' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">Free to use</span>
            </div>
            <h2 className="serif text-5xl sm:text-6xl font-normal text-white mb-6">
              Stop guessing.<br />
              <em className="gold-text not-italic">Start knowing.</em>
            </h2>
            <p className="text-white/35 mb-12 leading-relaxed font-light max-w-md mx-auto">
              PSA submission fees aren't cheap. One free analysis could save you $25–$300
              on cards that won't grade high enough to be worth it.
            </p>
            <Link href="/analyze">
              <button
                className="group inline-flex items-center gap-3 rounded-full pl-6 pr-2 py-2 text-[15px] font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', color: '#050505' }}
              >
                Analyze Your Card Free
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="px-8 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l1.3 3.9H11l-3 2.1 1.1 3.5L6 8.4 2.9 10.5 4 7 1 4.9h3.7L6 1z" fill="#C9A84C"/>
              </svg>
            </div>
            <span className="text-[13px] font-semibold tracking-wide">
              Card<span className="gold-text">Grade</span>
            </span>
          </div>
          <p className="text-[11px] text-white/20 text-center max-w-xs">
            Grade predictions are estimates only. Always verify with professional graders.
            Market data sourced from public eBay sold listings.
          </p>
        </div>
      </footer>

    </div>
  );
}
