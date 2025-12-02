'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  Image,
  Languages,
  PenTool,
  Lightbulb,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Trash2,
  History,
  Settings2,
  Download,
  ArrowLeft,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { useAIHistory } from '@/context/AIHistoryContext';

const AI_TOOLS = [
  { href: '/ai-workspace/chat', label: 'AI Chat', icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500' },
  { href: '/ai-workspace/document-summary', label: 'Document Summary', icon: FileText, gradient: 'from-purple-500 to-pink-500' },
  { href: '/ai-workspace/image-studio', label: 'Image Studio', icon: Image, gradient: 'from-orange-500 to-red-500' },
  { href: '/ai-workspace/translator', label: 'Translator', icon: Languages, gradient: 'from-green-500 to-emerald-500' },
  { href: '/ai-workspace/rewriter', label: 'Rewriter', icon: PenTool, gradient: 'from-violet-500 to-purple-500' },
  { href: '/ai-workspace/insights', label: 'Insights', icon: Lightbulb, gradient: 'from-yellow-500 to-orange-500' },
];

export function AISidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  
  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);
  
  // Use the shared history context
  const { 
    currentToolItems: historyItems, 
    selectItem, 
    removeItem, 
    clearHistory, 
    newChat,
    selectedItemId,
    currentSessionId
  } = useAIHistory();
  
  // Determine which item should be highlighted
  // Only highlight if the ID exists in history (don't highlight fresh new chats)
  const getActiveItemId = () => {
    // First check selectedItemId (explicitly clicked item)
    if (selectedItemId && historyItems.some(item => item.id === selectedItemId)) {
      return selectedItemId;
    }
    // Then check currentSessionId (only if it exists in history)
    if (currentSessionId && historyItems.some(item => item.id === currentSessionId)) {
      return currentSessionId;
    }
    // No highlight for fresh new chats
    return null;
  };
  const activeItemId = getActiveItemId();

  // Get current tool info
  const activeTool = AI_TOOLS.find(tool => pathname.startsWith(tool.href));

  // Action handlers
  const handleAction = (action: string) => {
    window.dispatchEvent(new CustomEvent('tool-action', { detail: action }));
  };
  
  const handleSelectHistory = (id: string) => {
    selectItem(id);
  };
  
  const handleDeleteHistory = (id: string) => {
    removeItem(id);
  };
  
  const handleNewChat = () => {
    newChat();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-3 left-3 z-50 p-2 bg-surface border border-border rounded-lg shadow-lg md:hidden"
          aria-label="Toggle sidebar"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}
      
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isMobile ? 280 : (isCollapsed ? 68 : 260),
          x: isMobile ? (isMobileOpen ? 0 : -280) : 0
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={`
          ${isMobile ? 'fixed left-0 top-0 z-50 h-full' : 'relative flex-shrink-0 h-full'}
          bg-surface border-r border-border flex flex-col overflow-hidden
        `}
      >
      {/* Header with Back Button */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <Link 
            href="/ai-workspace" 
            className={`flex items-center gap-2 text-text-secondary hover:text-text transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title="Back to AI Workspace"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">AI Workspace</span>}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-surface-highlight text-text-secondary hover:text-text transition-all flex-shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Current Tool Label */}
        {!isCollapsed && activeTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-3 pt-3 border-t border-border"
          >
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${activeTool.gradient}`}>
              <activeTool.icon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-text text-sm truncate">{activeTool.label}</span>
          </motion.div>
        )}
        {isCollapsed && activeTool && (
          <div className={`mt-3 p-1.5 rounded-lg bg-gradient-to-br ${activeTool.gradient} mx-auto w-fit`} title={activeTool.label}>
            <activeTool.icon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="flex-shrink-0 p-3">
        <button
          onClick={handleNewChat}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Tool Navigation */}
      <div className="flex-shrink-0 px-3 pb-2">
        {!isCollapsed && (
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 px-1">Tools</p>
        )}
        <div className="space-y-1">
          {AI_TOOLS.map((tool) => {
            const isActive = pathname.startsWith(tool.href);
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-text-secondary hover:bg-surface-highlight hover:text-text'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? tool.label : undefined}
              >
                <tool.icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{tool.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-border">
        {!isCollapsed && (
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 px-1">Actions</p>
        )}
        <div className="space-y-1">
          <button
            onClick={() => handleAction('history')}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-highlight hover:text-text transition-all ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'History' : undefined}
          >
            <History className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>History</span>}
          </button>
          <button
            onClick={() => handleAction('settings')}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-highlight hover:text-text transition-all ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings2 className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>
          <button
            onClick={() => handleAction('download')}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-highlight hover:text-text transition-all ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Download' : undefined}
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Download</span>}
          </button>
          <button
            onClick={() => handleAction('clear')}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-highlight hover:text-red-400 transition-all ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Clear Chat' : undefined}
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Clear Chat</span>}
          </button>
        </div>
      </div>

      {/* History Section */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {!isCollapsed && (
          <div className="px-4 py-2">
            <p className="text-[10px] uppercase tracking-wider text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              History
            </p>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <AnimatePresence>
            {historyItems.length > 0 ? (
              <div className="space-y-1">
                {historyItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleSelectHistory(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectHistory(item.id)}
                    className={`group w-full text-left px-2 py-2 rounded-lg transition-all cursor-pointer ${
                      activeItemId === item.id 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-surface-highlight'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.title : undefined}
                  >
                    {isCollapsed ? (
                      <MessageSquare className="w-4 h-4 text-text-secondary mx-auto" />
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text truncate">{item.title}</p>
                          <p className="text-[10px] text-text-muted truncate">{item.preview}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHistory(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 text-text-muted transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              !isCollapsed && (
                <div className="text-center py-6">
                  <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-text-muted">No chat history yet</p>
                </div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
    </>
  );
}
