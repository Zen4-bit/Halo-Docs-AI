'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Upload, Cpu, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRef, memo } from 'react';
import { Card } from '@/components/ui/Card';

const steps = [
    {
        number: '01',
        title: 'Upload Your Document',
        description: 'Drag and drop or select files from your device. Support for PDF, Word, images, and more.',
        icon: Upload,
        color: 'from-blue-500 to-cyan-500',
    },
    {
        number: '02',
        title: 'AI Processes Intelligence',
        description: 'Our advanced AI analyzes, extracts, and transforms your content with precision and speed.',
        icon: Cpu,
        color: 'from-purple-500 to-pink-500',
    },
    {
        number: '03',
        title: 'Download Results',
        description: 'Get your processed documents instantly. Perfect quality, every time.',
        icon: Download,
        color: 'from-green-500 to-emerald-500',
    },
];

const HowItWorks = memo(function HowItWorks() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

    return (
        <section ref={containerRef} className="py-16 md:py-24 lg:py-32 bg-background relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
            <motion.div style={{ y, willChange: 'transform' }} className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
            </motion.div>

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-20 lg:mb-24"
                >
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-6 py-2 mb-8 backdrop-blur-md">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-500 text-sm font-medium">Simple Process</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-text mb-4 md:mb-8 tracking-tight">
                        How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Works</span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed px-2">
                        Three simple steps to transform your documents with AI-powered intelligence.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection Line Container */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border overflow-hidden" style={{ transform: 'translateY(-50%)' }}>
                        {/* Progress Beam */}
                        <motion.div
                            className="absolute top-0 left-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent blur-sm"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.number}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.2 }}
                                    viewport={{ once: true }}
                                    className="relative"
                                >
                                    {/* Card */}
                                    <Card
                                        variant="glass"
                                        className="relative h-full p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-[2.5rem] hover:bg-surface transition-all duration-300 group z-10"
                                        hoverEffect={false}
                                    >
                                        {/* Step Number */}
                                        <div className="absolute -top-6 md:-top-8 left-6 md:left-10">
                                            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-300`}>
                                                <span className="text-white font-bold text-base md:text-xl">{step.number}</span>
                                            </div>
                                        </div>

                                        {/* Icon */}
                                        <div className="mb-6 md:mb-8 mt-6 md:mt-8">
                                            <div className="w-14 h-14 md:w-20 md:h-20 bg-surface-highlight rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-border">
                                                <Icon className="w-7 h-7 md:w-10 md:h-10 text-text-secondary" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-text mb-2 md:mb-4">{step.title}</h3>
                                        <p className="text-text-secondary text-sm md:text-base lg:text-lg leading-relaxed">{step.description}</p>

                                        {/* Decorative Element */}
                                        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-[2.5rem]`} />
                                    </Card>

                                    {/* Arrow (Desktop) */}
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-0">
                                            <ArrowRight className="w-8 h-8 text-border" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>


            </div>
        </section>
    );
});

HowItWorks.displayName = 'HowItWorks';

export default HowItWorks;
