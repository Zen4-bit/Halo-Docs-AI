'use client';

import { ReactNode } from 'react';
import ToolHeader from './ToolHeader';

interface ToolLayoutProps {
  tool: {
    name: string;
    description: string;
    icon: string;
    badge?: string;
    gradient?: string;
  };
  children: ReactNode;
}

export default function ToolLayout({ tool, children }: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 selection:bg-brand-500/30">
      <div>
        <ToolHeader
          title={tool.name}
          description={tool.description}
          icon={tool.icon}
          badge={tool.badge}
          gradient={tool.gradient}
        />

        <main className="max-w-5xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </main>
      </div>
    </div>
  );
}
