'use client';

import React, { useEffect, useRef, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AIResponseRendererProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
  autoScroll?: boolean;
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

// Memoized code block component
const CodeBlock = memo(({ language, children }: { language: string; children: string }) => (
  <div className="my-4 rounded-lg overflow-hidden">
    <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 flex justify-between items-center">
      <span>{language || 'code'}</span>
      <button
        onClick={() => navigator.clipboard.writeText(children)}
        className="hover:text-white transition-colors"
      >
        Copy
      </button>
    </div>
    <SyntaxHighlighter
      style={oneDark}
      language={language || 'text'}
      PreTag="div"
      customStyle={{
        margin: 0,
        borderRadius: '0 0 0.5rem 0.5rem',
        fontSize: '0.875rem',
      }}
    >
      {children}
    </SyntaxHighlighter>
  </div>
));
CodeBlock.displayName = 'CodeBlock';

// Memoized inline code component
const InlineCode = memo(({ children }: { children: React.ReactNode }) => (
  <code className="bg-gray-800/50 text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono">
    {children}
  </code>
));
InlineCode.displayName = 'InlineCode';

// Pre-process markdown to clean up common issues
function preprocessMarkdown(content: string): string {
  if (!content) return '';
  
  let processed = content;
  
  // Convert **1. Title:** pattern to proper heading
  processed = processed.replace(/\*\*(\d+)\.\s*([^*]+):\*\*/g, '\n### $1. $2\n');
  
  // Convert **Title:** pattern to heading
  processed = processed.replace(/\*\*([^*]+):\*\*\s*\n/g, '\n### $1\n');
  
  // Convert standalone **Title** on its own line to heading
  processed = processed.replace(/^(\*\*[^*\n]+\*\*)$/gm, (match) => {
    const title = match.replace(/\*\*/g, '');
    return `### ${title}`;
  });
  
  // Collapse multiple newlines to max 2
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  // Clean up bullet points - ensure proper list formatting
  processed = processed.replace(/^\s*[\*\-•]\s+/gm, '- ');
  
  // Ensure numbered lists have proper spacing
  processed = processed.replace(/^(\d+)\.\s+/gm, '$1. ');
  
  return processed.trim();
}

// Main component
const AIResponseRenderer = memo(({
  content,
  isStreaming = false,
  className = '',
  autoScroll = true,
  scrollContainerRef,
}: AIResponseRendererProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const lastScrollTop = useRef(0);

  // Process content
  const processedContent = useMemo(() => preprocessMarkdown(content), [content]);

  // Auto-scroll logic
  useEffect(() => {
    if (!autoScroll || !isStreaming) return;

    const container = scrollContainerRef?.current || contentRef.current?.parentElement;
    if (!container) return;

    // Check if user has scrolled up manually
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (scrollTop < lastScrollTop.current && !isNearBottom) {
        userScrolledUp.current = true;
      } else if (isNearBottom) {
        userScrolledUp.current = false;
      }
      
      lastScrollTop.current = scrollTop;
    };

    container.addEventListener('scroll', handleScroll);

    // Auto-scroll if user hasn't scrolled up
    if (!userScrolledUp.current) {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      });
    }

    return () => container.removeEventListener('scroll', handleScroll);
  }, [content, isStreaming, autoScroll, scrollContainerRef]);

  // Reset scroll tracking when streaming starts
  useEffect(() => {
    if (isStreaming) {
      userScrolledUp.current = false;
    }
  }, [isStreaming]);

  // Custom components for ReactMarkdown
  const components = useMemo(() => ({
    // Headings
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold text-white mt-6 mb-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-bold text-white mt-5 mb-3 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-semibold text-white mt-4 mb-2 first:mt-0">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-base font-semibold text-gray-200 mt-3 mb-2">{children}</h4>
    ),

    // Paragraphs
    p: ({ children }: any) => (
      <p className="text-gray-300 leading-relaxed mb-4 last:mb-0">{children}</p>
    ),

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-2 mb-4 text-gray-300 ml-2">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-300 ml-2">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-300 leading-relaxed pl-1">{children}</li>
    ),

    // Code
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');
      
      if (!inline && (match || codeContent.includes('\n'))) {
        return <CodeBlock language={match?.[1] || ''} children={codeContent} />;
      }
      
      return <InlineCode>{children}</InlineCode>;
    },

    // Blockquote
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-purple-500 pl-4 my-4 text-gray-400 italic">
        {children}
      </blockquote>
    ),

    // Links
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
      >
        {children}
      </a>
    ),

    // Table
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gray-800">{children}</thead>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-200 border-b border-gray-700">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700/50">
        {children}
      </td>
    ),

    // Horizontal rule
    hr: () => <hr className="my-6 border-gray-700" />,

    // Strong and emphasis
    strong: ({ children }: any) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-200">{children}</em>
    ),
  }), []);

  return (
    <motion.div
      ref={contentRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`ai-response prose prose-invert max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
      
      {/* Streaming cursor */}
      {isStreaming && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="inline-block w-2 h-5 bg-purple-500 ml-1 align-middle rounded-sm"
        />
      )}
    </motion.div>
  );
});

AIResponseRenderer.displayName = 'AIResponseRenderer';

export default AIResponseRenderer;

// Export a streaming message component with animation
export const StreamingMessage = memo(({
  content,
  isStreaming,
  className = '',
}: {
  content: string;
  isStreaming: boolean;
  className?: string;
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="message"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={className}
      >
        <AIResponseRenderer
          content={content}
          isStreaming={isStreaming}
          autoScroll={true}
        />
      </motion.div>
    </AnimatePresence>
  );
});

StreamingMessage.displayName = 'StreamingMessage';
