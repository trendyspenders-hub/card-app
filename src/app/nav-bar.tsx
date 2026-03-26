'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NavBar() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="rounded-lg bg-indigo-600 p-1.5 group-hover:bg-indigo-500 transition-colors">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              CardGrade<span className="text-indigo-400">AI</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/analyze"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Analyze Card
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              How It Works
            </Link>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="h-8 w-20 rounded-lg bg-gray-800 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="h-8 w-8 rounded-full border border-gray-700"
                  />
                )}
                <span className="hidden sm:block text-sm text-gray-400">
                  {session.user?.name?.split(' ')[0]}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => signIn('google')}
              >
                Sign in with Google
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
