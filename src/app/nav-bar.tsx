'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function NavBar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl">
        <div
          className="flex items-center justify-between px-4 py-2.5 backdrop-blur-xl"
          style={{
            background: 'rgba(12,12,12,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '9999px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
              style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l1.3 3.9H11l-3 2.1 1.1 3.5L6 8.4 2.9 10.5 4 7 1 4.9h3.7L6 1z" fill="#C9A84C"/>
              </svg>
            </div>
            <span className="text-[13px] font-semibold tracking-wide text-white">
              Card<span style={{ color: '#C9A84C' }}>Grade</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <Link href="/analyze" className="px-4 py-1.5 text-[13px] font-medium text-white/40 hover:text-white rounded-full transition-colors duration-300">Analyze</Link>
            <Link href="/#how-it-works" className="px-4 py-1.5 text-[13px] font-medium text-white/40 hover:text-white rounded-full transition-colors duration-300">How it works</Link>
          </div>

          <div className="flex items-center gap-2">
            {status === 'loading' ? (
              <div className="h-7 w-16 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            ) : session ? (
              <div className="hidden sm:flex items-center gap-2">
                {session.user?.image && (
                  <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" style={{ border: '1px solid rgba(201,168,76,0.3)' }} />
                )}
                <button onClick={() => signOut()} className="px-4 py-1.5 text-[12px] text-white/30 hover:text-white rounded-full transition-colors duration-300">
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold active:scale-95 transition-all duration-500"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.22)', color: '#C9A84C' }}
              >
                Sign in
              </button>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden flex flex-col items-center justify-center w-8 h-8 gap-1.5"
            >
              <span className="block w-4 h-px bg-white transition-all duration-500 origin-center"
                style={{ transform: menuOpen ? 'translateY(3.5px) rotate(45deg)' : 'none' }} />
              <span className="block w-4 h-px bg-white transition-all duration-500 origin-center"
                style={{ transform: menuOpen ? 'translateY(-3.5px) rotate(-45deg)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      <div
        className="fixed inset-0 z-40 sm:hidden flex flex-col items-center justify-center gap-6 backdrop-blur-3xl transition-all duration-700"
        style={{ background: 'rgba(5,5,5,0.94)', opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none' }}
      >
        {[
          { href: '/analyze', label: 'Analyze Card', delay: '100ms' },
          { href: '/#how-it-works', label: 'How It Works', delay: '160ms' },
        ].map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
            className="text-3xl font-light text-white transition-all duration-700"
            style={{ opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'translateY(0)' : 'translateY(16px)', transitionDelay: link.delay }}>
            {link.label}
          </Link>
        ))}
        {!session && (
          <button onClick={() => { signIn('google'); setMenuOpen(false); }}
            className="mt-4 px-8 py-3 rounded-full text-[15px] font-semibold transition-all duration-700"
            style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C97A)', color: '#050505', opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'translateY(0)' : 'translateY(16px)', transitionDelay: '220ms' }}>
            Sign in with Google
          </button>
        )}
      </div>
    </>
  );
}
