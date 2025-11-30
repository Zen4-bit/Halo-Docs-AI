'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brain, MessageSquare, FileText, Image, Languages, Lightbulb, Sparkles } from 'lucide-react';

const AI_TOOLS = [
    {
        id: 'chat',
        title: 'AI Chat',
        description: 'Conversational AI assistant for any question',
        icon: MessageSquare,
        href: '/ai-workspace/chat',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'summarize',
        title: 'Document Summary',
        description: 'Extract key points from any document',
        icon: FileText,
        href: '/ai-workspace/document-summary',
        gradient: 'from-purple-500 to-pink-500',
    },
    {
        id: 'image-studio',
        title: 'Image Studio',
        description: 'AI-powered image generation',
        icon: Image,
        href: '/ai-workspace/image-studio',
        gradient: 'from-orange-500 to-red-500',
    },
    {
        id: 'translator',
        title: 'AI Translator',
        description: 'Translate text between languages',
        icon: Languages,
        href: '/ai-workspace/translator',
        gradient: 'from-green-500 to-emerald-500',
    },
    {
        id: 'rewriter',
        title: 'AI Rewriter',
        description: 'Rephrase and improve your text',
        icon: Sparkles,
        href: '/ai-workspace/rewriter',
        gradient: 'from-violet-500 to-purple-500',
    },
    {
        id: 'insights',
        title: 'AI Insights',
        description: 'Get intelligent analysis and recommendations',
        icon: Lightbulb,
        href: '/ai-workspace/insights',
        gradient: 'from-yellow-500 to-orange-500',
    },
];

export default function AIWorkspacePage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTools = AI_TOOLS.filter(tool =>
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            AI Workspace
                        </h1>
                    </div>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Powerful AI tools for content creation, analysis, and transformation
                    </p>
                </div>

                {/* Search */}
                <div className="max-w-2xl mx-auto mb-12">
                    <input
                        type="text"
                        placeholder="Search AI tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                            <Link
                                key={tool.id}
                                href={tool.href}
                                className="group relative p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:transform hover:scale-105"
                            >
                                {/* Gradient Background on Hover */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                <div className="relative">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-slate-300 transition-all">
                                        {tool.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {tool.description}
                                    </p>

                                    {/* Arrow Icon */}
                                    <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="text-sm font-medium">Open Tool</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* No Results */}
                {filteredTools.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500">No tools found matching "{searchQuery}"</p>
                    </div>
                )}

                {/* Info Banner */}
                <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-2">Server-Powered AI</h3>
                            <p className="text-sm text-slate-400">
                                These AI tools use server-side processing with secure API integration. Your data is processed securely and not stored permanently.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
