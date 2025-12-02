'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Sparkles, Home, Wrench, CreditCard, HelpCircle, User, ArrowRight,
  Search, ChevronDown, FileText, Image as ImageIcon, Video, Zap, Shield, Layers,
  FileCode, PenTool, Scissors, Minimize2, Maximize2, RefreshCw, ArrowLeft,
  MessageSquare, Languages, Lightbulb, Brain, History, Trash2, Settings2, Download,
  Upload, Copy, Wand2, ImagePlus
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/Button';
import { unifiedRaf } from '@/lib/unified-raf';
import Logo from './Logo';

// Tool page configurations for dynamic header
const TOOL_CONFIGS: Record<string, { title: string; icon: React.ElementType; gradient: string; backHref: string; backLabel: string }> = {
  '/ai-workspace/chat': { title: 'AI Chat', icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500', backHref: '/ai-workspace', backLabel: 'AI Workspace' },
  '/ai-workspace/document-summary': { title: 'Document Summary', icon: FileText, gradient: 'from-purple-500 to-pink-500', backHref: '/ai-workspace', backLabel: 'AI Workspace' },
  '/ai-workspace/translator': { title: 'AI Translator', icon: Languages, gradient: 'from-green-500 to-emerald-500', backHref: '/ai-workspace', backLabel: 'AI Workspace' },
  '/ai-workspace/rewriter': { title: 'AI Rewriter', icon: Sparkles, gradient: 'from-violet-500 to-purple-500', backHref: '/ai-workspace', backLabel: 'AI Workspace' },
  '/ai-workspace/insights': { title: 'AI Insights', icon: Lightbulb, gradient: 'from-yellow-500 to-orange-500', backHref: '/ai-workspace', backLabel: 'AI Workspace' },
  '/ai-workspace/image-studio': { title: 'Image Studio', icon: ImageIcon, gradient: 'from-orange-500 to-red-500', backHref: '/ai-workspace', backLabel: 'AI Workspace' },
  '/tools/merge-pdf': { title: 'Merge PDF', icon: Layers, gradient: 'from-red-500 to-orange-500', backHref: '/tools', backLabel: 'Tools' },
  '/tools/split-pdf': { title: 'Split PDF', icon: Scissors, gradient: 'from-blue-500 to-indigo-500', backHref: '/tools', backLabel: 'Tools' },
  '/tools/compress-pdf': { title: 'Compress PDF', icon: Minimize2, gradient: 'from-green-500 to-teal-500', backHref: '/tools', backLabel: 'Tools' },
};

// Tool-specific header actions
const TOOL_ACTIONS: Record<string, { icon: React.ElementType; label: string; action: string }[]> = {
  '/ai-workspace/chat': [
    { icon: History, label: 'History', action: 'history' },
    { icon: Settings2, label: 'Settings', action: 'settings' },
    { icon: Download, label: 'Download', action: 'download' },
    { icon: Trash2, label: 'Clear', action: 'clear' },
  ],
  '/ai-workspace/document-summary': [
    { icon: Upload, label: 'Upload', action: 'upload' },
    { icon: Wand2, label: 'Analyze', action: 'analyze' },
    { icon: Copy, label: 'Copy', action: 'copy' },
    { icon: Download, label: 'Download', action: 'download' },
  ],
  '/ai-workspace/image-studio': [
    { icon: Upload, label: 'Upload', action: 'upload' },
    { icon: Wand2, label: 'Analyze', action: 'analyze' },
    { icon: ImagePlus, label: 'Generate', action: 'generate' },
    { icon: Download, label: 'Download', action: 'download' },
  ],
  '/ai-workspace/translator': [
    { icon: Copy, label: 'Copy', action: 'copy' },
    { icon: Download, label: 'Download', action: 'download' },
  ],
  '/ai-workspace/rewriter': [
    { icon: Upload, label: 'Upload', action: 'upload' },
    { icon: Copy, label: 'Copy', action: 'copy' },
    { icon: Download, label: 'Download', action: 'download' },
  ],
  '/ai-workspace/insights': [
    { icon: Upload, label: 'Upload', action: 'upload' },
    { icon: Copy, label: 'Copy', action: 'copy' },
    { icon: Download, label: 'Download', action: 'download' },
  ],
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  hasMegaMenu?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: <Home className="w-5 h-5" />, description: 'Welcome to HALO AI' },
  { href: '/features', label: 'Features', icon: <Zap className="w-5 h-5" />, description: 'Explore our capabilities', hasMegaMenu: true },
  { href: '/tools', label: 'Tools', icon: <Wrench className="w-5 h-5" />, description: 'AI-powered document tools', hasMegaMenu: true },
  { href: '/pricing', label: 'Pricing', icon: <CreditCard className="w-5 h-5" />, description: 'Flexible plans for everyone' },
  { href: '/help', label: 'Help', icon: <HelpCircle className="w-5 h-5" />, description: 'Get support and guidance' }
];

const toolsMenu = {
  'PDF Tools': [
    { label: 'Merge PDF', href: '/tools/merge-pdf', icon: Layers },
    { label: 'Split PDF', href: '/tools/split-pdf', icon: Scissors },
    { label: 'Compress PDF', href: '/tools/compress-pdf', icon: Minimize2 },
    { label: 'PDF to Word', href: '/tools/pdf-to-word', icon: RefreshCw },
  ],
  'AI Writing': [
    { label: 'AI Summarizer', href: '/ai-workspace/document-summary', icon: FileText },
    { label: 'AI Translator', href: '/ai-workspace/translator', icon: Languages },
    { label: 'Content Improver', href: '/ai-workspace/rewriter', icon: Sparkles },
    { label: 'AI Insights', href: '/ai-workspace/insights', icon: Lightbulb },
  ],
  'Media Tools': [
    { label: 'Image Studio', href: '/ai-workspace/image-studio', icon: ImageIcon },
    { label: 'Video Downloader', href: '/tools/video-downloader', icon: Video },
    { label: 'Image Resizer', href: '/tools/image-resizer', icon: Maximize2 },
    { label: 'Image Compressor', href: '/tools/image-compressor', icon: Minimize2 },
  ]
};

const featuresMenu = [
  { title: 'Intelligent Processing', desc: 'Automated data extraction and analysis.', icon: Zap, href: '/features#processing', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { title: 'Secure Vault', desc: 'Enterprise-grade security for your docs.', icon: Shield, href: '/features#security', color: 'text-green-400', bg: 'bg-green-400/10' },
  { title: 'Smart Workflows', desc: 'Connect tools to build custom pipelines.', icon: Layers, href: '/features#workflows', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { title: 'Global Collaboration', desc: 'Real-time editing and sharing.', icon: User, href: '/features#collaboration', color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();

  // Detect if we're on a tool page
  const toolConfig = useMemo(() => {
    return TOOL_CONFIGS[pathname] || null;
  }, [pathname]);
  
  const isToolPage = !!toolConfig;

  useEffect(() => {
    let lastScrolled = false;

    const onRaf = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== lastScrolled) {
        lastScrolled = isScrolled;
        setScrolled(isScrolled);
      }
    };

    const unsubscribe = unifiedRaf.subscribe(onRaf);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setActiveMenu(null);
  }, [pathname]);

  // Hide navigation completely inside AI Workspace tools (ChatGPT-style)
  const isAIWorkspaceTool = pathname.startsWith('/ai-workspace/') && pathname !== '/ai-workspace';
  if (isAIWorkspaceTool) {
    return null;
  }

  // Hide navigation completely for PDF Tools, Office Tools, and Media Tools
  // Routes under /tools/* (but not /tools index page)
  const isUtilityToolPage = pathname.startsWith('/tools/') && pathname !== '/tools';
  if (isUtilityToolPage) {
    return null;
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-colors duration-300 ${scrolled || activeMenu || isToolPage
          ? 'bg-surface/95 border-b border-border shadow-md'
          : 'bg-transparent border-b border-transparent'
          }`}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo / Tool Header */}
            {isToolPage && toolConfig ? (
              <div className="flex items-center gap-4">
                <Link href={toolConfig.backHref} className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm font-medium">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{toolConfig.backLabel}</span>
                </Link>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${toolConfig.gradient} shadow-lg`}>
                    <toolConfig.icon className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-text">{toolConfig.title}</h1>
                </div>
              </div>
            ) : (
              <Link href="/" className="group flex items-center space-x-3 relative z-[101]">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                  <div className="relative group-hover:scale-105 transition-transform duration-500">
                    <Logo className="w-10 h-10" />
                  </div>
                </div>
                <div className="text-text">
                  <div className="text-xl font-bold tracking-tight font-display">HALO</div>
                </div>
              </Link>
            )}

            {/* Desktop Navigation - Hide on tool pages */}
            {!isToolPage && (
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isMenuOpen = activeMenu === item.label;

                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => item.hasMegaMenu && setActiveMenu(item.label)}
                  >
                    <Link href={item.href}>
                      <div className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1 ${isActive || isMenuOpen ? 'text-primary' : 'text-text-secondary hover:text-text'
                        }`}>
                        {isActive && (
                          <motion.div
                            layoutId="nav-pill"
                            className="absolute inset-0 bg-primary/10 rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                        {item.hasMegaMenu && (
                          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Tool-specific actions - only show on AI tool pages */}
              {isToolPage && TOOL_ACTIONS[pathname] && (
                <div className="hidden md:flex items-center gap-1 mr-2 pr-3 border-r border-border">
                  {TOOL_ACTIONS[pathname].map((action) => (
                    <button
                      key={action.action}
                      onClick={() => {
                        // Dispatch custom event for tool to handle
                        window.dispatchEvent(new CustomEvent('tool-action', { detail: action.action }));
                      }}
                      className="group relative p-2 rounded-lg hover:bg-surface-highlight text-text-secondary hover:text-text transition-all"
                      title={action.label}
                    >
                      <action.icon className="w-4 h-4" />
                      {/* Tooltip */}
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] font-medium bg-surface border border-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <ThemeToggle />

              {!isToolPage && (
                <>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Search className="w-5 h-5" />
                  </Button>

                  <Link href="/login" className="hidden lg:block">
                    <Button variant="ghost" size="sm" leftIcon={<User className="w-4 h-4" />}>
                      Sign In
                    </Button>
                  </Link>

                  <div className="hidden lg:block">
                    <Link href="/dashboard">
                      <Button variant="primary" size="md" className="shadow-lg shadow-primary/25 hover:shadow-primary/40">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 text-text hover:bg-surface-highlight rounded-xl transition-all"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }} // Faster transition
              className="absolute top-full left-0 right-0 bg-surface border-b border-border overflow-hidden shadow-xl" // Removed backdrop-blur
              onMouseEnter={() => setActiveMenu(activeMenu)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <div className="max-w-7xl mx-auto px-8 py-8">
                {activeMenu === 'Tools' && (
                  <div className="grid grid-cols-3 gap-12">
                    {Object.entries(toolsMenu).map(([category, tools]) => (
                      <div key={category} className="space-y-4">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">{category}</h3>
                        <div className="grid gap-2">
                          {tools.map((tool) => (
                            <Link key={tool.href} href={tool.href} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-surface-highlight transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-surface-highlight flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors text-text-secondary">
                                <tool.icon className="w-4 h-4" />
                              </div>
                              <span className="text-text-secondary group-hover:text-text font-medium text-sm">{tool.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="glass-card p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                      <h4 className="text-lg font-bold text-text mb-2">All Tools Access</h4>
                      <p className="text-text-secondary text-sm mb-4">Get unlimited access to all 50+ AI tools with our Pro plan.</p>
                      <Link href="/pricing">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0 h-auto hover:bg-transparent" rightIcon={<ArrowRight className="w-3 h-3" />}>
                          View Pricing
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {activeMenu === 'Features' && (
                  <div className="grid grid-cols-4 gap-6">
                    {featuresMenu.map((feature) => (
                      <Link key={feature.title} href={feature.href} className="group p-4 rounded-2xl hover:bg-surface-highlight transition-all border border-transparent hover:border-border">
                        <div className={`w-10 h-10 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <feature.icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-text font-bold mb-1 group-hover:text-primary transition-colors">{feature.title}</h3>
                        <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 lg:hidden bg-background pt-24 px-4 overflow-y-auto"
          >
            <div className="flex flex-col space-y-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 ${pathname === item.href
                      ? 'bg-surface-highlight text-primary border border-border'
                      : 'text-text-secondary hover:bg-surface-highlight hover:text-text'
                      }`}
                  >
                    <div className={`p-3 rounded-xl ${pathname === item.href ? 'bg-primary/10 text-primary' : 'bg-surface-highlight text-text-secondary'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{item.label}</div>
                      <div className="text-sm opacity-60">{item.description}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-40" />
                  </Link>
                </motion.div>
              ))}

              <div className="pt-8 space-y-4">
                <Link href="/login" className="w-full">
                  <Button variant="secondary" size="lg" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full">
                  <Button variant="primary" size="lg" className="w-full justify-center shadow-lg shadow-primary/25">
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
