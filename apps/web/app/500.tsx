'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ServerError() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-lg space-y-8 rounded-[2.75rem] border border-white/12 bg-[#0b0f1c]/95 p-10 text-center shadow-[0_45px_120px_-70px_rgba(99,102,241,0.75)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-400 to-rose-400 text-white shadow-glow">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" focusable="false" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-white">Server Error</h1>
          <p className="text-sm text-white/70">
            Something went wrong on our end. Please try again later or contact support if the problem persists.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] hover:transform hover:-translate-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" focusable="false" />
            Go home
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] hover:bg-white/10 hover:transform hover:-translate-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            Get help
          </Link>
        </div>
      </div>
    </div>
  );
}
