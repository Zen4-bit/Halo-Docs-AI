'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { FileText, Brain, Sparkles, CheckCircle2, ArrowRight, Zap, Layers, Command, Search, BarChart3, Share2 } from 'lucide-react';
import Link from 'next/link';

const features = [
    {
        id: 1,
        title: "Intelligent Extraction",
        description: "Stop manual data entry. Our AI automatically identifies and extracts key information from any document type with 99% accuracy.",
        icon: Brain,
        color: "from-blue-500 to-cyan-500",
        stats: ["99% Accuracy", "< 2s Processing"],
        visual: "extraction"
    },
    {
        id: 2,
        title: "Smart Summarization",
        description: "Digest complex documents in seconds. Get concise, accurate summaries that highlight the most critical information.",
        icon: FileText,
        color: "from-purple-500 to-pink-500",
        stats: ["100+ Languages", "Context Aware"],
        visual: "summary"
    },
    {
        id: 3,
        title: "Automated Workflows",
        description: "Build powerful workflows that trigger actions based on document content. Route, approve, and export without lifting a finger.",
        icon: Sparkles,
        color: "from-orange-500 to-red-500",
        stats: ["Zero Latency", "Custom Rules"],
        visual: "workflow"
    }
];

export const FeatureShowcase = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section ref={containerRef} className="relative bg-background py-32 overflow-hidden">
            <div className="container mx-auto px-4">
                {features.map((feature, index) => (
                    <FeatureItem key={feature.id} feature={feature} index={index} />
                ))}
            </div>
        </section>
    );
};

const FeatureItem = ({ feature, index }: { feature: any, index: number }) => {
    const isEven = index % 2 === 0;
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 1, 1, 0]);

    return (
        <div ref={ref} className="min-h-screen flex items-center justify-center sticky top-0 py-20">
            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
                {/* Content Side */}
                <motion.div
                    style={{ opacity }}
                    className={`space-y-8 ${isEven ? 'order-1' : 'order-2'}`}
                >
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-2xl shadow-${feature.color.split('-')[1]}-500/20`}>
                        <feature.icon className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-5xl md:text-6xl font-bold text-text leading-tight tracking-tight font-display">
                        {feature.title}
                    </h2>

                    <p className="text-xl text-text-secondary leading-relaxed max-w-lg">
                        {feature.description}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        {feature.stats.map((stat: string, i: number) => (
                            <div key={i} className="px-6 py-2 rounded-full bg-surface-highlight border border-border text-sm font-medium text-text-secondary flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-text to-text-muted">{stat}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8">
                        <Link href="/dashboard">
                            <button className="group flex items-center gap-3 text-text font-bold text-lg hover:text-primary transition-colors">
                                <span className="border-b-2 border-border group-hover:border-primary pb-1 transition-colors">
                                    Try it now
                                </span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </div>
                </motion.div>

                {/* Visual Side */}
                <motion.div
                    style={{ y, opacity }}
                    className={`relative ${isEven ? 'order-2' : 'order-1'}`}
                >
                    <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-surface border border-border p-8 shadow-2xl group">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-20" />
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />

                        {/* Dynamic UI Content based on feature type */}
                        <div className="relative h-full w-full flex flex-col gap-6">
                            {/* Mock Window Header */}
                            <div className="h-14 w-full bg-surface-highlight backdrop-blur-md rounded-2xl flex items-center px-6 gap-3 border border-border z-20">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <div className="h-6 px-4 bg-surface rounded-full flex items-center gap-2">
                                        <Search className="w-3 h-3 text-text-muted" />
                                        <div className="w-20 h-2 bg-surface-highlight rounded-full" />
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 flex gap-6 relative z-10">
                                {/* Sidebar */}
                                <div className="w-20 bg-surface-highlight backdrop-blur-md rounded-2xl border border-border flex flex-col items-center py-6 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 1 ? 'bg-surface text-primary' : 'bg-surface/50 text-text-muted'}`}>
                                            {i === 1 && <Layers className="w-5 h-5" />}
                                            {i === 2 && <BarChart3 className="w-5 h-5" />}
                                            {i === 3 && <Share2 className="w-5 h-5" />}
                                        </div>
                                    ))}
                                </div>

                                {/* Main Panel */}
                                <div className="flex-1 bg-surface-highlight backdrop-blur-md rounded-2xl border border-border p-6 relative overflow-hidden">
                                    {feature.visual === 'extraction' && <ExtractionVisual />}
                                    {feature.visual === 'summary' && <SummaryVisual />}
                                    {feature.visual === 'workflow' && <WorkflowVisual />}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// --- Visual Components ---

const ExtractionVisual = () => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="h-8 w-32 bg-surface rounded-lg animate-pulse" />
                <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
            </div>

            <div className="flex-1 space-y-4 relative">
                {/* Scanning Line */}
                <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] z-10"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                {[1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.2 }}
                        className="flex gap-4 items-center p-4 rounded-xl bg-surface border border-border hover:bg-surface-highlight transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="h-2 bg-text-muted/20 rounded-full w-3/4" />
                            <div className="h-2 bg-text-muted/10 rounded-full w-1/2" />
                        </div>
                        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold">
                            98%
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const SummaryVisual = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 3);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/20">AI Summary</span>
                <span className="px-3 py-1 rounded-full bg-surface text-text-muted text-xs font-bold border border-border">Original</span>
            </div>

            <div className="flex-1 relative overflow-hidden rounded-xl bg-surface p-4 border border-border">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-3"
                    >
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className={`h-2 rounded-full w-full ${i === 1 || i === 3 ? 'bg-primary/40' : 'bg-text-muted/10'}`}
                                style={{ width: `${Math.random() * 30 + 70}%` }}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Typing Cursor Effect */}
                <motion.div
                    className="absolute bottom-4 right-4 w-2 h-4 bg-primary"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                />
            </div>
        </div>
    );
};

const WorkflowVisual = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 relative">
            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <motion.path
                    d="M 150 80 L 150 150"
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="2"
                    fill="none"
                />
                <motion.path
                    d="M 150 210 L 100 280"
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="2"
                    fill="none"
                />
                <motion.path
                    d="M 150 210 L 200 280"
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="2"
                    fill="none"
                />
            </svg>

            <motion.div
                animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(249,115,22,0)", "0 0 20px rgba(249,115,22,0.3)", "0 0 0px rgba(249,115,22,0)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 relative z-10"
            >
                <Command className="w-8 h-8 text-orange-400" />
            </motion.div>

            <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center relative z-10">
                <div className="w-2 h-2 bg-text-muted/20 rounded-full" />
            </div>

            <div className="flex gap-12 relative z-10">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                </motion.div>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"
                >
                    <Share2 className="w-5 h-5 text-blue-400" />
                </motion.div>
            </div>
        </div>
    );
};
