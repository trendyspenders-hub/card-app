import type { Metadata } from 'next';
import './globals.css';
import { SessionProviderWrapper } from './session-provider';
import NavBar from './nav-bar';

export const metadata: Metadata = {
  title: 'CardGrade — AI Sports Card Grading & Valuation',
  description:
    'Get instant AI-powered sports card grading predictions, real market comparables, and ROI analysis before you submit to PSA, BGS, or SGC.',
  keywords: ['sports card grading', 'PSA grade prediction', 'card valuation', 'AI grading'],
  openGraph: {
    title: 'CardGrade — Know Before You Grade',
    description: 'AI-powered sports card grading analysis. Instant results.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-white min-h-screen">
        {/* Ambient gradient mesh */}
        <div className="mesh-bg" aria-hidden="true" />
        <SessionProviderWrapper>
          <NavBar />
          <main className="relative z-10">{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
