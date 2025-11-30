'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Search, Command, Home, Wrench, CreditCard, HelpCircle,
    FileText, Zap, User, Settings, ArrowRight
} from 'lucide-react';

const commands = [
    {
        category: "Navigation",
        items: [
            { label: "Go to Home", icon: Home, href: "/" },
            { label: "Go to Dashboard", icon: Zap, href: "/dashboard" },
            { label: "Browse Tools", icon: Wrench, href: "/tools" },
            { label: "View Pricing", icon: CreditCard, href: "/pricing" },
            { label: "Help Center", icon: HelpCircle, href: "/help" },
        ]
    },
    {
        category: "Tools",
        items: [
            { label: "Resume Optimizer", icon: FileText, href: "/tools/resume-optimizer" },
            { label: "Proposal Writer", icon: FileText, href: "/tools/proposal-writer" },
            { label: "PDF Merger", icon: FileText, href: "/tools/merge" },
            { label: "Image Studio", icon: FileText, href: "/tools/image-studio" },
        ]
    },
    {
        category: "Account",
        items: [
            { label: "Profile Settings", icon: Settings, href: "/settings" },
            { label: "Sign In", icon: User, href: "/login" },
        ]
    }
];

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Toggle with Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Filter commands
    const filteredCommands = commands.map(group => ({
        ...group,
        items: group.items.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase())
        )
    })).filter(group => group.items.length > 0);

    const flattenCommands = filteredCommands.flatMap(group => group.items);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % flattenCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + flattenCommands.length) % flattenCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = flattenCommands[selectedIndex];
                if (item) {
                    router.push(item.href);
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, flattenCommands, router]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-2xl bg-[#0f1629] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-4 border-b border-white/10">
                            <Search className="w-5 h-5 text-white/40 mr-3" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent text-lg text-white placeholder-white/40 focus:outline-none"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                            />
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-xs text-white/40 font-mono">
                                <span>ESC</span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="overflow-y-auto p-2 custom-scrollbar">
                            {filteredCommands.length > 0 ? (
                                filteredCommands.map((group, groupIndex) => (
                                    <div key={group.category} className="mb-2">
                                        <div className="px-3 py-2 text-xs font-bold text-white/30 uppercase tracking-wider">
                                            {group.category}
                                        </div>
                                        {group.items.map((item, itemIndex) => {
                                            // Calculate global index for selection
                                            let globalIndex = 0;
                                            for (let i = 0; i < groupIndex; i++) {
                                                globalIndex += filteredCommands[i]?.items.length || 0;
                                            }
                                            globalIndex += itemIndex;

                                            const isSelected = globalIndex === selectedIndex;

                                            return (
                                                <button
                                                    key={item.label}
                                                    onClick={() => {
                                                        router.push(item.href);
                                                        setIsOpen(false);
                                                    }}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${isSelected ? 'bg-purple-500/20 text-white' : 'text-white/60 hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40'}`}>
                                                            <item.icon className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium">{item.label}</span>
                                                    </div>
                                                    {isSelected && <ArrowRight className="w-4 h-4 text-purple-400" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-white/40">
                                    <Command className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No results found for "{query}"</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">↑↓</kbd> to navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">↵</kbd> to select
                                </span>
                            </div>
                            <div>
                                HALO AI Command Palette
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
