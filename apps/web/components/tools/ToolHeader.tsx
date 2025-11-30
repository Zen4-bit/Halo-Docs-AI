'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: string;
  badge?: string | undefined;
  gradient?: string | undefined;
}

export default function ToolHeader({ title, description, icon, badge, gradient }: ToolHeaderProps) {
  return (
    <div className="border-b border-white/5 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link
            href="/tools"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            Tools
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white/80">{title}</span>
        </nav>

        <div className="flex items-start gap-6">
          <div
            className={clsx(
              "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-2xl shadow-brand-500/20 ring-1 ring-white/10",
              gradient || 'from-brand-500 to-blue-600'
            )}
          >
            <span className="text-3xl">{icon}</span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
              {badge && (
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-lg text-white/60 leading-relaxed max-w-2xl">{description}</p>
          </div>

          <Link
            href="/tools"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
