'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Sparkles, Zap, Shield, CheckCircle2 } from 'lucide-react';

export const PricingHero = () => {
    const ref = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = ({ clientX, clientY }: React.MouseEvent) => {
        const { left, top, width, height } = ref.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
        const x = (clientX - left) / width;
        const y = (clientY - top) / height;
        mouseX.set(x);
        mouseY.set(y);
    };

    return (
        <section
            ref={ref}
            onMouseMove={handleMouseMove}
            className="relative py-32 bg-background overflow-hidden text-center min-h-[70vh] flex flex-col justify-center"
        >
            {/* Advanced Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 dark:opacity-20 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />

                {/* Mouse Follower Spotlight */}
                <motion.div
                    className="absolute w-[800px] h-[800px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"
                    style={{
                        x: useTransform(mouseX, [0, 1], [-400, 400]),
                        y: useTransform(mouseY, [0, 1], [-400, 400]),
                    }}
                />

                {/* Gradient Orbs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px]"
                />

                {/* Floating Particles */}
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-slate-900/20 dark:bg-white/40 rounded-full"
                        initial={{
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%",
                            opacity: Math.random() * 0.5 + 0.3,
                            scale: Math.random() * 0.5 + 0.5,
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            opacity: [null, 0],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md mb-8 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-default group"
                >
                    <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-medium text-slate-600 dark:text-white/80">Simple, Transparent Pricing</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 dark:text-white mb-8 leading-tight tracking-tight"
                >
                    Choose the Plan That <br />
                    <span className="relative inline-block">
                        <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-3xl opacity-20" />
                        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 animate-gradient-x">
                            Fits Your Scale
                        </span>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-slate-600 dark:text-white/60 max-w-2xl mx-auto leading-relaxed mb-12"
                >
                    Whether you're an individual creator or a global enterprise, we have a plan designed to help you succeed with HALO AI.
                </motion.p>

                {/* Feature Highlights */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-wrap justify-center gap-4 md:gap-12 text-slate-600 dark:text-white/80"
                >
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-6 py-3 rounded-full border border-slate-200 dark:border-white/5 backdrop-blur-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                        <div className="p-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20">
                            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="font-medium">Instant Access</span>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-6 py-3 rounded-full border border-slate-200 dark:border-white/5 backdrop-blur-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                        <div className="p-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20">
                            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium">Secure & Private</span>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-6 py-3 rounded-full border border-slate-200 dark:border-white/5 backdrop-blur-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                        <div className="p-1 rounded-full bg-pink-500/10 dark:bg-pink-500/20">
                            <CheckCircle2 className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        <span className="font-medium">Cancel Anytime</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
