'use client';

import { Fragment, useMemo, useState } from 'react';
import { HelpCircle, Book, MessageCircle, Video, FileQuestion } from 'lucide-react';
import Link from 'next/link';

const categories = [
  {
    icon: Book,
    title: 'Getting Started',
    description: 'Learn the basics of HALO Docs AI',
    articles: [
      'How to create an account',
      'Uploading your first document',
      'Understanding AI tools',
      'Navigating the dashboard',
    ],
  },
  {
    icon: FileQuestion,
    title: 'AI Tools',
    description: 'Master our AI-powered features',
    articles: [
      'Using the AI Summarizer',
      'Translating documents',
      'Content improvement tips',
      'Redacting sensitive information',
    ],
  },
  {
    icon: Video,
    title: 'PDF Utilities',
    description: 'Work with PDF files',
    articles: [
      'Merging multiple PDFs',
      'Splitting PDF pages',
      'Compressing large files',
      'Adding watermarks',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Account & Billing',
    description: 'Manage your subscription',
    articles: [
      'Upgrading your plan',
      'Payment methods',
      'Canceling subscription',
      'Billing FAQs',
    ],
  },
];

const faqs = [
  {
    question: 'What file formats are supported?',
    answer: 'We support PDF, DOC, DOCX, and TXT files up to 50MB on the free plan.',
  },
  {
    question: 'How accurate is the AI processing?',
    answer: 'Our AI is powered by Halo-AI and provides high accuracy, but results may vary based on document quality and complexity.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, all uploads are encrypted and automatically deleted after 30 days. We never share your data with third parties.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: "Yes, you can cancel your subscription at any time from the Settings page. You'll retain access until the end of your billing period.",
  },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'ig');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-brand-500/30 px-1 text-white">
        {part}
      </mark>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    ),
  );
};

export default function HelpCenterPage() {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) {
      return categories.map((category) => ({
        ...category,
        filteredArticles: category.articles,
      }));
    }

    return categories
      .map((category) => {
        const filteredArticles = category.articles.filter((article) =>
          article.toLowerCase().includes(normalizedQuery),
        );

        if (
          filteredArticles.length === 0 &&
          !category.title.toLowerCase().includes(normalizedQuery) &&
          !category.description.toLowerCase().includes(normalizedQuery)
        ) {
          return null;
        }

        return {
          ...category,
          filteredArticles:
            filteredArticles.length > 0 ? filteredArticles : category.articles.slice(0, 3),
        };
      })
      .filter(Boolean) as Array<(typeof categories)[number] & { filteredArticles: string[] }>;
  }, [normalizedQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) {
      return faqs;
    }

    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(normalizedQuery) ||
        faq.answer.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const totalMatches = normalizedQuery
    ? filteredCategories.reduce(
      (total, category) =>
        total +
        category.filteredArticles.filter((article) =>
          article.toLowerCase().includes(normalizedQuery),
        ).length,
      0,
    ) + filteredFaqs.length
    : filteredCategories.reduce((total, category) => total + category.filteredArticles.length, 0);

  return (
    <div className="container pb-24 pt-12">
      <div className="mx-auto max-w-6xl space-y-16">
        <header className="text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-300 to-accent-sky text-white shadow-glow-brand">
            <HelpCircle className="h-7 w-7" aria-hidden="true" focusable="false" />
          </div>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white sm:text-5xl">Help Center</h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            Browse documentation, watch quick tutorials, or reach our support team.
          </p>
        </header>

        <div className="space-y-3">
          <label htmlFor="help-search" className="sr-only">
            Search the help center
          </label>
          <input
            id="help-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for guides, videos, or troubleshooting..."
            className="input w-full text-base bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40"
            aria-describedby="help-search-helper"
          />
          <p id="help-search-helper" className="text-xs text-slate-500 dark:text-white/50">
            Search articles, FAQs, or tutorial videos by keyword. Press Enter to highlight results.
          </p>
          {normalizedQuery ? (
            <p className="text-sm text-slate-600 dark:text-white/60">
              Showing {totalMatches} result{totalMatches === 1 ? '' : 's'} for{' '}
              <span className="font-semibold text-slate-900 dark:text-white">“{query}”</span>
            </p>
          ) : null}
        </div>

        <section>
          <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Browse by category</h2>
          {filteredCategories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/15 px-6 py-12 text-center text-sm text-slate-500 dark:text-white/60">
              No categories match{' '}
              <span className="font-semibold text-slate-900 dark:text-white">“{query}”</span>. Try different keywords
              like <span className="text-slate-900 dark:text-white">“upload”</span> or <span className="text-slate-900 dark:text-white">“AI tools”</span>.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredCategories.map((category) => {
                const Icon = category.icon;
                const matchesCategory = category.title.toLowerCase().includes(normalizedQuery);

                return (
                  <article
                    key={category.title}
                    className="surface-panel transition-all hover:-translate-y-1 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-brand-400/60 dark:hover:border-brand-400/60 hover:shadow-lg rounded-2xl p-6"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-300 to-accent-sky">
                        <Icon className="h-6 w-6 text-white" aria-hidden="true" focusable="false" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {matchesCategory ? highlightMatch(category.title, query) : category.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-white/70">
                      {category.filteredArticles.map((article) => (
                        <li key={article}>
                          <a
                            href="#"
                            className="inline-flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:text-brand-600 dark:hover:text-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/40" aria-hidden="true" />
                            {normalizedQuery
                              ? highlightMatch(article, query)
                              : article}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Frequently asked questions</h2>
          {filteredFaqs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/15 px-6 py-12 text-center text-sm text-slate-500 dark:text-white/60">
              No FAQs answer <span className="font-semibold text-slate-900 dark:text-white">“{query}”</span>. You can{' '}
              <Link href="/contact" className="text-brand-600 dark:text-brand-100 hover:text-brand-700 dark:hover:text-brand-200">
                reach out to support
              </Link>{' '}
              for help.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <details key={faq.question} className="surface-panel border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl p-6 open:bg-slate-50 dark:open:bg-white/10 transition-colors">
                  <summary className="cursor-pointer text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between list-none">
                    {highlightMatch(faq.question, query)}
                    <span className="ml-4 text-slate-400 dark:text-white/40">+</span>
                  </summary>
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {highlightMatch(faq.answer, query)}
                  </p>
                </details>
              ))}
            </div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-accent-sky/5 dark:from-brand-500/25 dark:via-brand-500/10 dark:to-accent-sky/10 px-8 py-10 text-center shadow-glow-brand backdrop-blur-3xl">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Still need help?</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-white/75">
            Can’t find what you’re looking for? Our support engineers respond in under two hours on
            business days.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/contact"
              className="btn-contrast inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-white/90 transition-colors"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" focusable="false" />
              Contact support
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
