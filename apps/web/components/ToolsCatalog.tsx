'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search, Sparkles, FileText, Briefcase, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  allTools,
  aiTools,
  mediaTools,
  officeTools,
  pdfTools,
  type ToolCategory,
  type ToolMeta,
} from '@/lib/tools-data';
import { trackToolOpened } from '@/lib/analytics';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface ToolsCatalogProps {
  heading: ReactNode;
  subheading?: ReactNode;
  className?: string;
}

const categoryConfig: Record<ToolCategory, { label: string; icon: any; description: string }> = {
  ai: { label: 'AI Workspace', icon: Sparkles, description: 'Intelligent automation' },
  pdf: { label: 'PDF Tools', icon: FileText, description: 'Document control' },
  office: { label: 'Office', icon: Briefcase, description: 'Productivity boosters' },
  media: { label: 'Media', icon: Play, description: 'Convert & edit' },
};

const toolsByCategory = {
  ai: aiTools,
  pdf: pdfTools,
  office: officeTools,
  media: mediaTools,
} satisfies Record<ToolCategory, ToolMeta[]>;

const filterToolsBySearch = (tools: ToolMeta[], query: string) => {
  if (!query) return tools;
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  return tools.filter((tool) => {
    const haystack = `${tool.name} ${tool.description} ${tool.id}`.toLowerCase();
    return searchTerms.some(term => haystack.includes(term));
  });
};

const ToolCard = ({ tool }: { tool: ToolMeta }) => (
  <Link
    href={tool.href}
    className="block h-full"
    onClick={() => trackToolOpened(tool.id, tool.category)}
  >
    <Card
      variant="glass"
      className="group relative h-full overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-2xl hover:shadow-brand-500/20"
      hoverEffect={true}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-4 flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${tool.color}`}>
            <span className="text-xl">{tool.icon}</span>
          </div>
          <div className="opacity-0 transition-all duration-300 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5 text-slate-400 dark:text-white/50" />
          </div>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-200 transition-colors">
          {tool.name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-white/60 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>
    </Card>
  </Link>
);

export default function ToolsCatalog({ heading, subheading, className }: ToolsCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const categories = Object.keys(categoryConfig) as ToolCategory[];

  return (
    <div className={className}>
      <div className="mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              {heading}
            </h1>
            {subheading && (
              <p className="text-base text-slate-500 dark:text-white/60 md:text-lg">{subheading}</p>
            )}
          </div>
          <div className="relative w-full md:w-80 shrink-0">
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tools..."
              className="w-full"
              icon={<Search className="h-4 w-4 text-slate-400 dark:text-white/40" />}
            />
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 -mx-6 px-6 py-4 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/5 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((category) => {
            const config = categoryConfig[category];
            const Icon = config.icon;
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="space-y-16">
        {categories.map((category) => {
          if (activeCategory !== 'all' && activeCategory !== category) return null;
          const tools = filterToolsBySearch(toolsByCategory[category], normalizedSearch);
          if (tools.length === 0) return null;
          return (
            <section key={category} className="space-y-6">
              <div className="flex items-end justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {categoryConfig[category].label}
                  <span className="text-xs font-normal text-slate-500 dark:text-white/40 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5">
                    {tools.length}
                  </span>
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ToolCard tool={tool} />
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
