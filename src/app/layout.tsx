import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { SessionProviderWrapper } from './session-provider';
import NavBar from './nav-bar';

export const metadata: Metadata = {
  title: 'CardGrade — Free AI Sports Card Grading & PSA Grade Predictor',
  description:
    'Get an instant AI-powered PSA, BGS, and SGC grade prediction for your sports card. Upload your card and receive centering analysis, corner scores, surface defect detection, real market comparables, and a grading ROI calculator — free.',
  keywords: [
    'sports card grading',
    'PSA grade predictor',
    'PSA 10 checker',
    'is my card worth grading',
    'card grading AI',
    'BGS grade prediction',
    'card centering tool',
    'sports card value',
    'free card grading',
    'card grading calculator',
    'PSA vs BGS',
    'grading ROI calculator',
    'baseball card grading',
    'basketball card grading',
    'pokemon card grading',
  ],
  openGraph: {
    title: 'CardGrade — Know Before You Grade',
    description:
      'Free AI-powered PSA grade prediction, market comps, and ROI calculator for sports cards. Upload any card and get results in under 30 seconds.',
    type: 'website',
    url: 'https://card-app-sand.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CardGrade — Free AI Sports Card Grading',
    description: 'AI-predicted PSA grades, live market comps, and ROI analysis. Free forever.',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CardGrade',
  description:
    'AI-powered sports card grading prediction tool. Analyzes centering, corners, surface, and edges to predict PSA, BGS, and SGC grades.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'AI grade prediction',
    'Centering analysis',
    'Corner wear detection',
    'Surface defect scanning',
    'Live market comparables',
    'Grading ROI calculator',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#050505] text-white min-h-screen">
        <div className="mesh-bg" aria-hidden="true" />
        <SessionProviderWrapper>
          <NavBar />
          <main className="relative z-10">{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
