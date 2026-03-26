import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProviderWrapper } from './session-provider';
import NavBar from './nav-bar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CardGrade AI — AI Sports Card Grading & Valuation',
  description:
    'Get instant AI-powered sports card grading predictions, market comparables, and ROI analysis before you submit to PSA, BGS, or SGC.',
  keywords: ['sports card grading', 'PSA grade prediction', 'card valuation', 'AI grading'],
  openGraph: {
    title: 'CardGrade AI',
    description: 'Know before you grade. AI-powered sports card grading analysis.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <SessionProviderWrapper>
          <NavBar />
          <main>{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
