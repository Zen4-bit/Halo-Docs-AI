'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageLoadingProps {
  label?: string;
  description?: ReactNode;
  showBackdrop?: boolean;
}

export function PageLoading({
  label = 'Loading',
  description,
  showBackdrop = true,
}: PageLoadingProps) {
  return (
    <div
      className="flex min-h-[280px] items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={typeof label === 'string' ? label : undefined}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <AnimatePresence initial={false}>
          <motion.div
            key="spinner"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
            className="rounded-full bg-gradient-to-br from-brand-400/40 via-brand-200/30 to-brand-500/50 p-[1px]"
            aria-hidden="true"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Loader2 className="h-6 w-6 text-brand animate-spin" aria-hidden="true" focusable="false" />
            </div>
          </motion.div>
        </AnimatePresence>
        <span className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">
          {label}
        </span>
        {description ? (
          <p className="max-w-sm text-xs text-white/60">{description}</p>
        ) : null}
      </div>

      {showBackdrop ? (
        <div
          className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950/75 via-slate-950/55 to-indigo-950/35 backdrop-blur-md"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

export function PageLoadingOverlay({
  label = 'Loading',
  description,
}: PageLoadingProps) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <PageLoading label={label} description={description} showBackdrop={false} />
    </div>
  );
}

export default PageLoading;

