import Link from 'next/link';
import { Compass, Home, LifeBuoy } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-2xl space-y-12 rounded-[2.75rem] border border-white/10 bg-white/[0.06] p-10 text-center shadow-[0_40px_100px_-70px_rgba(14,165,233,0.8)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-300 to-accent-sky text-white shadow-glow-brand">
          <Compass className="h-7 w-7" aria-hidden="true" focusable="false" />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/45">
            404 — Page not found
          </p>
          <h1 className="text-4xl font-semibold text-white md:text-5xl">
            We couldn&rsquo;t find that destination
          </h1>
          <p className="text-sm text-white/70">
            The page you&apos;re looking for may have moved or no longer exists. Try the shortcuts
            below or head back to the dashboard.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all duration-200 active:scale-[0.98] hover:transform hover:-translate-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            <Home className="h-4 w-4" aria-hidden="true" focusable="false" />
            Go home
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] hover:bg-white/10 hover:transform hover:-translate-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden="true" focusable="false" />
            Visit help center
          </Link>
        </div>
      </div>
    </div>
  );
}

