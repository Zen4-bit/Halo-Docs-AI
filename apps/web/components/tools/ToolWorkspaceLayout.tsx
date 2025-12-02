'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronsLeft, 
  ChevronsRight,
  Settings2,
  ChevronDown,
  ChevronUp,
  X,
  Menu
} from 'lucide-react';
import Logo from '../Logo';

// Context for panel state
interface ToolWorkspaceContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const ToolWorkspaceContext = createContext<ToolWorkspaceContextType>({
  isCollapsed: false,
  toggleCollapse: () => {},
});

export const useToolWorkspace = () => useContext(ToolWorkspaceContext);

// Settings Section Component
interface SettingsSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isCollapsed?: boolean;
}

export function SettingsSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = true,
  isCollapsed = false 
}: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isCollapsed) return null;

  return (
    <div className="border-b border-slate-200 dark:border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-brand-500 dark:text-amber-400">{icon}</span>}
          <span className="text-sm font-medium text-slate-800 dark:text-white/90">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/40" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Settings Toggle Component
interface SettingsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}

export function SettingsToggle({ label, description, checked, onChange, icon }: SettingsToggleProps) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/8 cursor-pointer transition-colors group">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-slate-300 dark:bg-white/10 rounded-full peer peer-checked:bg-brand-500 dark:peer-checked:bg-amber-500/80 transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-brand-500/70 dark:text-amber-400/70">{icon}</span>}
          <span className="text-sm text-slate-700 dark:text-white/80">{label}</span>
        </div>
        {description && (
          <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

// Settings Slider Component
interface SettingsSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showValue?: boolean;
}

export function SettingsSlider({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  unit = '',
  showValue = true
}: SettingsSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600 dark:text-white/70">{label}</span>
        {showValue && (
          <span className="text-sm font-medium text-brand-600 dark:text-amber-400">{value}{unit}</span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer 
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 dark:[&::-webkit-slider-thumb]:bg-amber-400 
          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:hover:bg-brand-400 dark:[&::-webkit-slider-thumb]:hover:bg-amber-300 [&::-webkit-slider-thumb]:transition-colors"
      />
      <div className="flex justify-between text-xs text-slate-400 dark:text-white/30">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// Settings Select Component
interface SettingsSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}

export function SettingsSelect({ label, value, onChange, options, icon }: SettingsSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand-500/70 dark:text-amber-400/70">{icon}</span>}
        <span className="text-sm text-slate-600 dark:text-white/70">{label}</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white/90
          focus:outline-none focus:border-brand-500/50 dark:focus:border-amber-500/50 focus:ring-1 focus:ring-brand-500/20 dark:focus:ring-amber-500/20 transition-colors
          cursor-pointer appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5rem' }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-zinc-900">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Settings Input Component
interface SettingsInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'password';
  placeholder?: string;
  icon?: React.ReactNode;
  suffix?: string;
}

export function SettingsInput({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  placeholder,
  icon,
  suffix 
}: SettingsInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand-500/70 dark:text-amber-400/70">{icon}</span>}
        <span className="text-sm text-slate-600 dark:text-white/70">{label}</span>
      </div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white/90
            placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 dark:focus:border-amber-500/50 focus:ring-1 
            focus:ring-brand-500/20 dark:focus:ring-amber-500/20 transition-colors"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-white/40">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// Settings Button Group Component
interface SettingsButtonGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
}

export function SettingsButtonGroup({ label, value, onChange, options }: SettingsButtonGroupProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm text-slate-600 dark:text-white/70">{label}</span>
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-lg">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              value === option.value
                ? 'bg-brand-500 dark:bg-amber-500 text-white dark:text-black shadow-sm'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white/90 hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Main Layout Props
interface ToolWorkspaceLayoutProps {
  children: React.ReactNode;
  toolName: string;
  toolIcon: React.ReactNode;
  toolColor: string;
  settingsPanel: React.ReactNode;
  actionButton: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    icon?: React.ReactNode;
  };
  onBack?: () => void;
}

export default function ToolWorkspaceLayout({
  children,
  toolName,
  toolIcon,
  toolColor,
  settingsPanel,
  actionButton,
  onBack,
}: ToolWorkspaceLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <ToolWorkspaceContext.Provider value={{ isCollapsed, toggleCollapse }}>
      <div className="flex h-screen bg-slate-50 dark:bg-background overflow-hidden">
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Left Settings Panel */}
        <motion.aside
          initial={false}
          animate={{ 
            width: isMobile ? (isMobileMenuOpen ? 320 : 0) : (isCollapsed ? 64 : 320),
            x: isMobile && !isMobileMenuOpen ? -320 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`flex-shrink-0 flex flex-col bg-white dark:bg-surface border-r border-slate-200 dark:border-white/5 overflow-x-hidden
            ${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'}`}
        >
          {/* Panel Header */}
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-white/5">
            {/* Logo + Collapse Row */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Logo className="w-8 h-8" />
                  <div className="absolute -inset-1 bg-brand-500/20 dark:bg-amber-500/20 rounded-full blur-md -z-10" />
                </div>
                <AnimatePresence mode="wait">
                  {(!isCollapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-bold text-lg text-slate-900 dark:text-white"
                    >
                      HALO
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              {isMobile ? (
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  title="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={toggleCollapse}
                  className="p-2 rounded-lg text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  {isCollapsed ? (
                    <ChevronsRight className="w-4 h-4" />
                  ) : (
                    <ChevronsLeft className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Back to Tools Button */}
            <AnimatePresence mode="wait">
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-3"
                >
                  <Link
                    href="/tools"
                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Tools</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tool Title - Only when collapsed on desktop */}
            {isCollapsed && !isMobile && (
              <div className="flex justify-center pb-3">
                <Link
                  href="/tools"
                  className="p-2 rounded-lg text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  title="Back to Tools"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Settings Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
            <AnimatePresence mode="wait">
              {(!isCollapsed || isMobile) ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-2"
                >
                  {/* Tool Header in Settings */}
                  <div className="px-4 py-3 mb-2 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${toolColor}`}>
                        {toolIcon}
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">{toolName}</h2>
                        <p className="text-xs text-slate-500 dark:text-white/40">Advanced Settings</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Settings Sections */}
                  {settingsPanel}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-4 gap-2"
                >
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${toolColor}`}>
                    {toolIcon}
                  </div>
                  <div className="p-2 text-slate-400 dark:text-white/40" title="Settings">
                    <Settings2 className="w-4 h-4" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-surface border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${toolColor}`}>
                  {toolIcon}
                </div>
                <div>
                  <h1 className="font-semibold text-slate-900 dark:text-white text-sm">{toolName}</h1>
                </div>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                title="Open settings"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Workspace Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            {children}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex-shrink-0 p-4 bg-white dark:bg-surface border-t border-slate-200 dark:border-white/5">
            <button
              onClick={actionButton.onClick}
              disabled={actionButton.disabled || actionButton.loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                actionButton.disabled || actionButton.loading
                  ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 cursor-not-allowed'
                  : `bg-gradient-to-r ${toolColor} text-white hover:shadow-lg hover:shadow-brand-500/20 dark:hover:shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99]`
              }`}
            >
              {actionButton.loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {actionButton.loadingText || 'Processing...'}
                </>
              ) : (
                <>
                  {actionButton.icon}
                  {actionButton.label}
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </ToolWorkspaceContext.Provider>
  );
}

// Custom Scrollbar Styles - add to globals.css
// .custom-scrollbar::-webkit-scrollbar { width: 6px; }
// .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
// .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
