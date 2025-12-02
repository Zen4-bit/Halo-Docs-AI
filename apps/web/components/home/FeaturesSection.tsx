'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Brain, Zap, Shield, Sparkles, FileText, Video, Image as ImageIcon, Scissors, ArrowRight } from 'lucide-react';
import { useRef, memo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const categories = [
    {
        id: 'ai-intelligence',
        title: 'AI Intelligence',
        description: 'Powerful AI tools that understand and process your content',
        icon: Brain,
        color: 'from-purple-500 to-pink-500',
        tools: [
            { name: 'AI Summarizer', icon: FileText, href: '/ai-workspace/document-summary' },
            { name: 'AI Translator', icon: Brain, href: '/ai-workspace/translator' },
            { name: 'Content Improver', icon: Sparkles, href: '/ai-workspace/rewriter' },
            { name: 'AI Redactor', icon: Shield, href: '/ai-workspace/insights' },
            { name: 'AI Reviewer', icon: Zap, href: '/ai-workspace/insights' },
            { name: 'AI Insights', icon: Brain, href: '/ai-workspace/insights' },
        ],
    },
    {
        id: 'pdf-utilities',
        title: 'PDF Utilities',
        description: 'Professional PDF tools for all your document needs',
        icon: FileText,
        color: 'from-blue-500 to-cyan-500',
        tools: [
            { name: 'Merge PDF', icon: FileText, href: '/tools/merge-pdf' },
            { name: 'Split PDF', icon: Scissors, href: '/tools/split-pdf' },
            { name: 'Compress PDF', icon: Zap, href: '/tools/compress-pdf' },
            { name: 'Rotate PDF', icon: FileText, href: '/tools/rotate-pdf' },
            { name: 'Watermark PDF', icon: Shield, href: '/tools/add-watermark' },
            { name: 'Page Numbers', icon: FileText, href: '/tools/add-page-numbers' },
        ],
    },
    {
        id: 'media-tools',
        title: 'Media Tools',
        description: 'Create and edit images and videos with AI',
        icon: ImageIcon,
        color: 'from-pink-500 to-rose-500',
        tools: [
            { name: 'Image Studio', icon: ImageIcon, href: '/ai-workspace/image-studio' },
            { name: 'Video Forge', icon: Video, href: '/tools/video-downloader' },
            { name: 'HALO Chat', icon: Brain, href: '/ai-workspace/chat' },
        ],
    },
    {
        id: 'office-productivity',
        title: 'Office Productivity',
        description: 'Boost your productivity with smart automation',
        icon: Sparkles,
        color: 'from-orange-500 to-red-500',
        tools: [
            { name: 'Word to PDF', icon: FileText, href: '/tools/word-to-pdf' },
            { name: 'Excel to PDF', icon: FileText, href: '/tools/excel-to-pdf' },
            { name: 'PPT to PDF', icon: Sparkles, href: '/tools/ppt-to-pdf' },
        ],
    },
];

const FeaturesSection = memo(function FeaturesSection() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);

    return (
        <motion.section
            ref={containerRef}
            style={{ opacity }}
            className="py-16 md:py-24 lg:py-32 bg-background relative overflow-x-clip overflow-y-visible"
        >
            {/* Advanced Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />

            <motion.div
                className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
                style={{ willChange: 'transform' }}
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, -50, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl"
                style={{ willChange: 'transform' }}
                animate={{
                    scale: [1, 1.1, 1],
                    x: [0, -30, 0],
                    y: [0, 30, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-20 lg:mb-24"
                >
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-6 py-2 mb-8 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-primary text-sm font-medium">Complete Catalog</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-text mb-4 md:mb-8 tracking-tight">
                        Browse by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-blue-500">Workflow</span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed px-2">
                        Mix and match AI, PDF, and office workflows in one place. All tools designed to work together seamlessly.
                    </p>
                </motion.div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-20 overflow-visible">
                    {categories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -8 }}
                                className="group relative overflow-visible"
                            >
                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] blur-xl"
                                    style={{ background: `linear-gradient(135deg, ${category.color})`, opacity: 0.1 }} />

                                <Card
                                    variant="glass"
                                    className="h-full flex flex-col p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-[2.5rem] overflow-visible"
                                    hoverEffect={false}
                                >
                                    {/* Category Header */}
                                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 md:gap-6 mb-4 md:mb-6 overflow-visible">
                                        <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text mb-2 md:mb-3">{category.title}</h3>
                                            <p className="text-text-secondary text-sm sm:text-base md:text-lg leading-relaxed">{category.description}</p>
                                        </div>
                                        <div className="hidden sm:block px-3 md:px-4 py-1 rounded-full bg-surface-highlight border border-border text-text-muted text-xs md:text-sm font-medium flex-shrink-0">
                                            {category.tools.length} Tools
                                        </div>
                                    </div>

                                    {/* Tools Grid */}
                                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-x-4 md:gap-y-5 mb-6 md:mb-8 mt-2 overflow-visible">
                                        {category.tools.map((tool, toolIndex) => {
                                            const ToolIcon = tool.icon;
                                            return (
                                                <Link key={tool.name} href={tool.href} className="block overflow-visible">
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        whileInView={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.3, delay: index * 0.1 + toolIndex * 0.05 }}
                                                        viewport={{ once: true }}
                                                        whileHover={{ scale: 1.02 }}
                                                        className="relative overflow-visible bg-surface-highlight/50 border border-border rounded-xl md:rounded-2xl p-3 md:p-4 transition-all duration-200 cursor-pointer group/tool hover:bg-surface-highlight"
                                                        style={{ overflow: 'visible' }}
                                                    >
                                                        <div className="flex items-center gap-3 overflow-visible">
                                                            <div className="w-9 h-9 md:w-10 md:h-10 min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px] bg-surface rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 group-hover/tool:bg-primary/10 transition-colors">
                                                                <ToolIcon className="w-4 h-4 md:w-5 md:h-5 text-text-secondary group-hover/tool:text-primary transition-colors" />
                                                            </div>
                                                            <span className="text-text-secondary font-medium text-xs sm:text-sm group-hover/tool:text-text transition-colors truncate">{tool.name}</span>
                                                        </div>
                                                    </motion.div>
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    {/* View All Link */}
                                    <div className="mt-auto pt-4 md:pt-6 border-t border-border">
                                        <Link
                                            href={`/tools#${category.id}`}
                                            className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-medium group/link"
                                        >
                                            View all {category.title} tools
                                            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <Link href="/tools">
                        <Button variant="primary" size="lg" className="rounded-xl px-8 py-6 text-lg shadow-lg hover:shadow-primary/25" rightIcon={<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}>
                            Explore All Tools
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </motion.section>
    );
});

FeaturesSection.displayName = 'FeaturesSection';

export default FeaturesSection;
