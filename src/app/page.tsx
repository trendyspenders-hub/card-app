'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const FAQS = [
  {
    q: 'How accurate is the AI grade prediction?',
    a: 'Our model achieves ~92% accuracy within one grade point when compared against actual PSA and BGS grades. Results depend on image quality — a clear, well-lit photo from 12–18 inches away will give the most accurate prediction.',
  },
  {
    q: 'Which grading companies does CardGrade support?',
    a: 'Our grade scale maps directly to PSA (1–10), BGS (1–10 with sub-grades), and SGC (1–100 legacy / 1–10 modern). The ROI calculator lets you compare expected returns across all three services.',
  },
  {
    q: 'What sports and card types does it work on?',
    a: 'Baseball, basketball, football, hockey, soccer, and Pokémon/TCG cards. The AI is trained on all major card formats including standard, rookie cards, refractors, prizms, autos, and relics.',
  },
  {
    q: 'Do I need the back of the card?',
    a: 'Front is required, back is optional. The front carries 70–80% of the grading weight (centering, surface). Providing the back improves accuracy by approximately 8–12%.',
  },
  {
    q: 'How is this different from just looking at my card myself?',
    a: 'The human eye cannot measure centering precisely — our computer vision measures border widths to the pixel. Corners and surface are scored using defect detection trained on thousands of professionally graded cards, catching issues invisible to the naked eye.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes. Basic analysis is completely free. We plan to offer a premium tier with bulk analysis, portfolio tracking, and auto-submission integration, but the core grade prediction and market comps will always be free.',
  },
  {
    q: 'How current is the market data?',
    a: 'Market comparables are pulled from eBay sold listings and updated regularly. We display the last 90 days of sales by default, with the most recent sales weighted more heavily in the average.',
  },
  {
    q: 'What makes a card worth grading?',
    a: 'A card is generally worth grading when the PSA 10 sale price minus grading cost exceeds the raw card value by at least 2x. Our ROI calculator automates this math using your predicted grade probability and live market prices.',
  },
];

const GRADING_SERVICES = [
  { name: 'PSA', turnaround: '6–12 months', cost: '$25–$300', bestFor: 'Maximum resale value', color: '#3B82F6' },
  { name: 'BGS / Beckett', turnaround: '3–6 months', cost: '$20–$250', bestFor: 'Sub-grades & Pristines', color: '#8B5CF6' },
  { name: 'SGC', turnaround: '4–8 weeks', cost: '$18–$150', bestFor: 'Speed & vintage cards', color: '#10B981' },
  { name: 'CGC', turnaround: '4–10 weeks', cost: '$15–$100', bestFor: 'TCG / Pokémon cards', color: '#F59E0B' },
];

const GRADE_SCALE = [
  { grade: 10, label: 'Gem Mint', color: '#10B981', desc: 'Perfect centering, sharp corners, no defects' },
  { grade: 9, label: 'Mint', color: '#22C55E', desc: 'Minor imperfections only' },
  { grade: 8, label: 'Near Mint–Mint', color: '#84CC16', desc: 'Slight surface wear or centering' },
  { grade: 7, label: 'Near Mint', color: '#EAB308', desc: 'Minor corner or edge wear' },
  { grade: 6, label: 'Ex–NM', color: '#F97316', desc: 'Light crease or surface break' },
  { grade: 5, label: 'Excellent', color: '#EF4444', desc: 'Multiple defects, creases' },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Scroll reveal
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    // Floating CTA visibility
    const onScroll = () => setScrolled(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <div className="relative">

      {/* ─── FLOATING CTA (appears on scroll) ──────────────────────── */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ opacity: scrolled ? 1 : 0, transform: `translateX(-50%) translateY(${scrolled ? '0' : '16px'})`, pointerEvents: scrolled ? 'auto' : 'none' }}
      >
        <Link href="/analyze">
          <button
            className="group flex items-center gap-3 rounded-full pl-5 pr-2 py-2 text-[14px] font-semibold shadow-2xl active:scale-95 transition-all duration-500"
            style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C97A)', color: '#050505', boxShadow: '0 8px 32px rgba(201,168,76,0.35)' }}
          >
            Analyze My Card — Free
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black/15 transition-transform duration-500 group-hover:translate-x-0.5">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5h9M6.5 2l4.5 4.5L6.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </button>
        </Link>
      </div>

      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-32 pb-24 text-center overflow-hidden">
        <div className="reveal inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#C9A84C]">AI-Powered Card Grading Analysis</span>
        </div>

        <h1 className="reveal delay-1 serif text-5xl sm:text-7xl lg:text-8xl font-normal text-white leading-[1.05] max-w-4xl mb-6">
          Know Before<br /><em className="gold-text not-italic">You Grade</em>
        </h1>

        <p className="reveal delay-2 max-w-xl text-[17px] text-white/40 leading-relaxed mb-12 font-light">
          Upload your sports card and get an instant AI-predicted PSA / BGS / SGC grade,
          real market comparables, and a clear ROI answer — before spending a dollar on submission.
        </p>

        <div className="reveal delay-3 flex flex-col sm:flex-row gap-3 items-center">
          <Link href="/analyze">
            <button
              className="group flex items-center gap-3 rounded-full pl-6 pr-2 py-2 text-[15px] font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C97A)', color: '#050505' }}
            >
              Analyze My Card Free
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </button>
          </Link>
          <a href="#how-it-works">
            <button className="flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium text-white/40 hover:text-white transition-colors duration-400">
              See how it works
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2l4 4-4 4M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </a>
        </div>

        {/* Stats */}
        <div className="reveal delay-4 mt-20 flex flex-col sm:flex-row gap-px w-full max-w-lg">
          {[
            { value: '92%', label: 'Grade accuracy' },
            { value: 'Free', label: 'Always' },
            { value: '<30s', label: 'Analysis time' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex-1 py-6 px-4 text-center"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: i === 0 ? '1rem 0 0 1rem' : i === 2 ? '0 1rem 1rem 0' : '0' }}>
              <div className="text-2xl font-bold gold-text mb-1">{stat.value}</div>
              <div className="text-[12px] text-white/30 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Card categories */}
        <div className="reveal delay-5 mt-8 flex flex-wrap justify-center gap-2">
          {['Baseball', 'Basketball', 'Football', 'Hockey', 'Pokémon', 'Soccer', 'Vintage'].map((sport) => (
            <span key={sport} className="px-3 py-1 rounded-full text-[11px] text-white/25 uppercase tracking-wider"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              {sport}
            </span>
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-20">
          <span className="text-[10px] uppercase tracking-[0.25em] text-white">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      <div className="gold-line mx-8 sm:mx-16" />

      {/* ─── FEATURES BENTO ─────────────────────────────────────────── */}
      <section className="py-32 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">The Platform</span>
            </div>
            <h2 className="serif text-4xl sm:text-5xl font-normal text-white mb-4">
              Everything graders use.<br /><em className="gold-text not-italic">Now in your pocket.</em>
            </h2>
            <p className="text-white/35 max-w-md mx-auto font-light leading-relaxed">
              Our AI replicates the exact four criteria PSA, BGS, and SGC use to assign grades — centering, corners, edges, and surface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Large: AI Grading */}
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
                <h3 className="serif text-3xl font-normal text-white mb-3">Grade prediction<br />with confidence.</h3>
                <p className="text-white/40 leading-relaxed mb-8 font-light">
                  YOLOv8 computer vision detects and isolates your card, then OpenCV measures centering to the pixel.
                  All four corners are scored individually on a 1–10 scale. Surface defects — scratches, print lines,
                  holo damage, creases — are flagged with bounding boxes and severity ratings.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Pixel-precise centering',
                    '4-corner individual scoring',
                    'Surface scratch detection',
                    'Print line & holo damage',
                    'PSA / BGS / SGC scale',
                    'Confidence percentage',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-[13px] text-white/50">
                      <span className="w-1 h-1 rounded-full bg-[#C9A84C] flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="md:col-span-5 flex flex-col gap-4">
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
                  <p className="text-[13px] text-white/35 leading-relaxed font-light mb-4">
                    Real eBay sold prices for PSA 9, PSA 10, BGS 9.5, and raw — from the last 90 days. Population reports included.
                  </p>
                  <div className="flex gap-2">
                    {['PSA 9', 'PSA 10', 'Raw'].map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] text-white/30"
                        style={{ border: '1px solid rgba(255,255,255,0.07)' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

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
                    Grading cost + shipping vs. expected sale price by grade. Clear profit/loss with a "Worth Grading" verdict.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-line mx-8 sm:mx-16" />

      {/* ─── HOW IT WORKS — DETAILED ────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">The Process</span>
            </div>
            <h2 className="serif text-4xl sm:text-5xl font-normal text-white mb-4">
              How the AI grades<br /><em className="not-italic text-white/35">your card.</em>
            </h2>
            <p className="text-white/35 max-w-md mx-auto font-light">
              Four-phase machine learning pipeline — the same criteria professional graders use, now automated.
            </p>
          </div>

          {/* Phase steps */}
          <div className="space-y-4">
            {[
              {
                num: '01',
                title: 'Upload & Card Detection',
                sub: 'YOLOv8 isolates your card',
                desc: 'Photograph or upload your card from 12–18 inches away in good lighting. Our YOLOv8 model detects the card edges, corrects perspective distortion, and isolates just the card for analysis. Works with any smartphone camera.',
                tags: ['JPEG, PNG, HEIC', 'Auto perspective fix', 'Front + back support'],
              },
              {
                num: '02',
                title: 'Centering Analysis',
                sub: 'OpenCV pixel measurement',
                desc: 'OpenCV measures the left, right, top, and bottom borders to the pixel. Centering is expressed as a ratio (e.g., 55/45) and mapped to PSA standards: 55/45 or better qualifies for PSA 10, 60/40 for PSA 9, and so on.',
                tags: ['Pixel-precise borders', 'Left/right + top/bottom', 'PSA centering standards'],
              },
              {
                num: '03',
                title: 'Corner & Edge Scoring',
                sub: 'Detectron2 instance segmentation',
                desc: 'Each of the four corners is cropped and scored individually using Laplacian variance and edge density analysis — the same sharpness measurements professional graders check. For high-value cards, Detectron2 provides mask-level precision scoring.',
                tags: ['4 corners scored individually', 'Fraying & rounding detection', 'Edge straightness check'],
              },
              {
                num: '04',
                title: 'Surface & Grade Prediction',
                sub: 'Defect detection + weighted scoring',
                desc: 'YOLOv8-seg scans the surface for scratches, creases, dimples, print lines, and holo damage. Each defect is flagged with severity (minor / moderate / severe). The final grade is a weighted combination: corners 35%, surface 20%, edges 20%, centering 25%.',
                tags: ['6 defect types detected', 'Severity classification', 'Confidence score output'],
              },
            ].map((phase, i) => (
              <div key={phase.num} className={`reveal delay-${i + 1} bezel-outer`}>
                <div className="bezel-inner p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="serif text-5xl font-normal" style={{ color: 'rgba(201,168,76,0.2)' }}>{phase.num}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-[18px] font-semibold text-white">{phase.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider text-[#C9A84C]"
                          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}>
                          {phase.sub}
                        </span>
                      </div>
                      <p className="text-[14px] text-white/40 leading-relaxed font-light mb-4">{phase.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {phase.tags.map((tag) => (
                          <span key={tag} className="px-3 py-1 rounded-full text-[12px] text-white/30"
                            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-line mx-8 sm:mx-16" />

      {/* ─── GRADE SCALE ────────────────────────────────────────────── */}
      <section className="py-32 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Grade Scale</span>
            </div>
            <h2 className="serif text-4xl sm:text-5xl font-normal text-white mb-4">
              What the grades<br /><em className="not-italic text-white/35">actually mean.</em>
            </h2>
            <p className="text-white/35 max-w-sm mx-auto font-light">
              PSA grades 1–10. The difference between a 9 and a 10 can be worth thousands of dollars.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GRADE_SCALE.map((g, i) => (
              <div key={g.grade} className={`reveal delay-${i + 1} bezel-outer`}>
                <div className="bezel-inner p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="serif text-4xl font-normal" style={{ color: g.color }}>{g.grade}</span>
                    <div>
                      <div className="text-[13px] font-semibold text-white">{g.label}</div>
                      <div className="text-[11px] text-white/25 uppercase tracking-wider">PSA {g.grade}</div>
                    </div>
                  </div>
                  <p className="text-[13px] text-white/35 font-light">{g.desc}</p>
                  <div className="mt-3 h-0.5 rounded-full" style={{ background: g.color, opacity: 0.3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-line mx-8 sm:mx-16" />

      {/* ─── GRADING SERVICES COMPARISON ────────────────────────────── */}
      <section className="py-32 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Grading Services</span>
            </div>
            <h2 className="serif text-4xl sm:text-5xl font-normal text-white mb-4">
              PSA vs BGS vs SGC.<br /><em className="not-italic text-white/35">Which is right for you?</em>
            </h2>
            <p className="text-white/35 max-w-sm mx-auto font-light">
              Our ROI calculator compares expected returns across all four major grading companies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GRADING_SERVICES.map((s, i) => (
              <div key={s.name} className={`reveal delay-${i + 1} bezel-outer`}>
                <div className="bezel-inner p-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                    <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.name.slice(0,3)}</span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-white mb-4">{s.name}</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Turnaround</div>
                      <div className="text-[13px] text-white/60">{s.turnaround}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Cost range</div>
                      <div className="text-[13px] text-white/60">{s.cost}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Best for</div>
                      <div className="text-[13px] text-white/60">{s.bestFor}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal mt-8 text-center">
            <Link href="/analyze">
              <button className="text-[13px] text-[#C9A84C] hover:text-[#E8C97A] transition-colors duration-300 underline underline-offset-4" style={{ textDecorationColor: 'rgba(201,168,76,0.3)' }}>
                Calculate your ROI across all services →
              </button>
            </Link>
          </div>
        </div>
      </section>

      <div className="gold-line mx-8 sm:mx-16" />

      {/* ─── IS MY CARD WORTH GRADING? ──────────────────────────────── */}
      <section className="py-32 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-16">
            <h2 className="serif text-4xl sm:text-5xl font-normal text-white mb-4">
              Is my card worth<br /><em className="gold-text not-italic">grading?</em>
            </h2>
            <p className="text-white/35 max-w-md mx-auto font-light">
              The rule of thumb — and why CardGrade makes it precise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              {
                title: 'The Raw Value',
                desc: 'What can you sell the card for right now, ungraded? If a raw copy sells for $20, grading at $25+ almost never makes sense.',
                verdict: 'Starting point',
                color: 'rgba(255,255,255,0.15)',
              },
              {
                title: 'The Grade Jump',
                desc: 'What does a PSA 9 sell for? What about a PSA 10? The spread between grades — sometimes $50, sometimes $5,000 — determines whether submission is worth it.',
                verdict: 'The key variable',
                color: '#C9A84C',
              },
              {
                title: 'The True Cost',
                desc: 'PSA regular tier costs $25–$50 + shipping ($15–$30 round trip) + wait time (up to 12 months). All-in cost matters more than the sticker price.',
                verdict: 'Often underestimated',
                color: 'rgba(255,255,255,0.15)',
              },
            ].map((item, i) => (
              <div key={item.title} className={`reveal delay-${i + 1} bezel-outer`}>
                <div className="bezel-inner p-6">
                  <div className="w-6 h-6 rounded-full mb-4 flex-shrink-0" style={{ background: item.color }} />
                  <h3 className="text-[16px] font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed font-light mb-4">{item.desc}</p>
                  <span className="text-[11px] uppercase tracking-wider text-white/20">{item.verdict}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Formula */}
          <div className="reveal bezel-outer bezel-gold">
            <div className="bezel-inner p-8 text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#C9A84C] mb-4">The Formula</div>
              <div className="serif text-2xl sm:text-3xl font-normal text-white mb-4">
                (P(10) × PSA10 price) + (P(9) × PSA9 price) − Total cost &gt; Raw value × 1.5
              </div>
              <p className="text-[13px] text-white/35 font-light max-w-lg mx-auto">
                CardGrade calculates this automatically using your AI-predicted grade probability and live market prices. One click. One clear answer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-line mx-8 sm:mx-16" />

      {/* ─── FAQ ────────────────────────────────────────────────────── */}
      <section className="py-32 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="reveal text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">FAQ</span>
            </div>
            <h2 className="serif text-4xl sm:text-5xl font-normal text-white">
              Common questions.
            </h2>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="reveal bezel-outer" style={{ transitionDelay: `${i * 40}ms` }}>
                <div className="bezel-inner">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-6 text-left transition-colors duration-300"
                  >
                    <span className="text-[15px] font-medium text-white">{faq.q}</span>
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                      style={{
                        background: openFaq === i ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                        border: openFaq === i ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.08)',
                        transform: openFaq === i ? 'rotate(45deg)' : 'none',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1v8M1 5h8" stroke={openFaq === i ? '#C9A84C' : 'rgba(255,255,255,0.4)'} strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    style={{ maxHeight: openFaq === i ? '300px' : '0' }}
                  >
                    <p className="px-6 pb-6 text-[14px] text-white/40 leading-relaxed font-light">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-line mx-8 sm:mx-16" />

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="py-40 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-8"
              style={{ border: '1px solid rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.06)' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">Free forever</span>
            </div>
            <h2 className="serif text-5xl sm:text-6xl font-normal text-white mb-6">
              Stop guessing.<br /><em className="gold-text not-italic">Start knowing.</em>
            </h2>
            <p className="text-white/35 mb-12 leading-relaxed font-light max-w-md mx-auto">
              PSA submission fees aren't cheap. One free analysis could save you $25–$300
              on cards that won't grade high enough to justify the cost.
            </p>
            <Link href="/analyze">
              <button
                className="group inline-flex items-center gap-3 rounded-full pl-6 pr-2 py-2 text-[15px] font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C97A)', color: '#050505', boxShadow: '0 8px 40px rgba(201,168,76,0.2)' }}
              >
                Analyze Your Card Free
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black/15 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </button>
            </Link>
            <p className="mt-6 text-[12px] text-white/15">No account required. No credit card. Just upload and analyze.</p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="px-8 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1l1.3 3.9H11l-3 2.1 1.1 3.5L6 8.4 2.9 10.5 4 7 1 4.9h3.7L6 1z" fill="#C9A84C"/>
                </svg>
              </div>
              <span className="text-[13px] font-semibold tracking-wide">Card<span className="gold-text">Grade</span></span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {['Baseball Cards', 'Basketball Cards', 'Football Cards', 'Pokémon Cards', 'Vintage Cards'].map((link) => (
                <Link key={link} href="/analyze"
                  className="text-[12px] text-white/20 hover:text-white/50 transition-colors duration-300">
                  {link}
                </Link>
              ))}
            </div>
          </div>
          <div className="gold-line" />
          <p className="mt-6 text-[11px] text-white/15 text-center">
            Grade predictions are estimates only and should not be used as professional appraisals.
            Always verify with professional grading services. Market data sourced from public eBay sold listings.
            CardGrade is not affiliated with PSA, BGS, SGC, or CGC.
          </p>
        </div>
      </footer>

    </div>
  );
}
