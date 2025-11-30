'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Sparkles, Home, Wrench, CreditCard, HelpCircle, User, ArrowRight,
  Search, ChevronDown, FileText, Image as ImageIcon, Video, Zap, Shield, Layers,
  FileCode, PenTool, Scissors, Minimize2, Maximize2, RefreshCw
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/Button';
import { unifiedRaf } from '@/lib/unified-raf';
import Logo from './Logo';

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
    { label: 'Merge PDF', href: '/tools/merge', icon: Layers },
    { label: 'Split PDF', href: '/tools/split', icon: Scissors },
    { label: 'Compress PDF', href: '/tools/compress', icon: Minimize2 },
    { label: 'Convert PDF', href: '/tools/convert', icon: RefreshCw },
  ],
  'AI Writing': [
    { label: 'Resume Optimizer', href: '/tools/resume-optimizer', icon: FileText },
    { label: 'Proposal Writer', href: '/tools/proposal-writer', icon: PenTool },
    { label: 'Summarizer', href: '/tools/summarizer', icon: FileCode },
    { label: 'Content Improver', href: '/tools/content-improver', icon: Sparkles },
  ],
  'Media Tools': [
    { label: 'Image Studio', href: '/tools/image-studio', icon: ImageIcon },
    { label: 'Video Forge', href: '/tools/video-forge', icon: Video },
    { label: 'Resize Image', href: '/tools/resize-image', icon: Maximize2 },
    { label: 'Compress Image', href: '/tools/compress-image', icon: Minimize2 },
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

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-colors duration-300 ${scrolled || activeMenu
          ? 'bg-surface/95 border-b border-border shadow-md' // Removed backdrop-blur, used high opacity
          : 'bg-transparent border-b border-transparent'
          }`}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
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

            {/* Desktop Navigation */}
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

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />

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
