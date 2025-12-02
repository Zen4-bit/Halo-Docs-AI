'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, History, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon: React.ReactNode;
  iconGradient: string;
  backHref: string;
  backLabel: string;
  badge?: string;
  badgeColor?: string;
  showHistory?: boolean;
  historyItems?: { id: string; title: string; timestamp: Date; preview?: string }[];
  onHistorySelect?: (id: string) => void;
  onHistoryClear?: () => void;
}

export default function ToolPageLayout({
  children,
  title,
  description,
  icon,
  iconGradient,
  backHref,
  backLabel,
  badge,
  badgeColor = 'bg-primary/20 text-primary',
  showHistory = false,
  historyItems = [],
  onHistorySelect,
  onHistoryClear,
}: ToolPageLayoutProps) {
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <div className="tool-page min-h-screen">
      {/* Compact Sub-header with Back Button and Title */}
      <div className="sticky top-20 z-40 tool-bg-surface tool-border border-b backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Back Button + Title */}
            <div className="flex items-center gap-4">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 tool-text-muted hover:tool-text transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </Link>
              
              <div className="h-6 w-px tool-bg-highlight" />
              
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${iconGradient} shadow-lg`}>
                  {icon}
                </div>
                <div>
                  <h1 className="text-lg font-bold tool-text">{title}</h1>
                </div>
              </div>
              
              {badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}>
                  {badge}
                </span>
              )}
            </div>
            
            {/* Right: History Toggle (if enabled) */}
            {showHistory && historyItems.length > 0 && (
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg tool-bg-highlight hover:opacity-80 tool-text-secondary text-sm font-medium transition-all"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-primary/20 text-primary">
                  {historyItems.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      <AnimatePresence>
        {historyOpen && showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setHistoryOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] z-50 tool-bg-surface tool-border border-l shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 tool-border border-b">
                  <h3 className="font-semibold tool-text flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Session History
                  </h3>
                  <div className="flex items-center gap-2">
                    {onHistoryClear && historyItems.length > 0 && (
                      <button
                        onClick={onHistoryClear}
                        className="text-xs tool-text-muted hover:text-red-500 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setHistoryOpen(false)}
                      className="p-1.5 rounded-lg tool-bg-highlight tool-text-muted hover:tool-text transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* History Items */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {historyItems.length === 0 ? (
                    <div className="text-center py-8 tool-text-muted text-sm">
                      No history yet
                    </div>
                  ) : (
                    historyItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onHistorySelect?.(item.id);
                          setHistoryOpen(false);
                        }}
                        className="w-full p-3 rounded-xl tool-bg-highlight hover:opacity-80 text-left transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium tool-text text-sm truncate flex-1">
                            {item.title}
                          </span>
                          <ChevronRight className="w-4 h-4 tool-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {item.preview && (
                          <p className="text-xs tool-text-muted line-clamp-2">{item.preview}</p>
                        )}
                        <p className="text-xs tool-text-muted mt-1">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
