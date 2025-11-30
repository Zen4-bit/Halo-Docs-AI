'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Brain, Zap, Shield, Globe, Sparkles, MousePointer2, Layers } from 'lucide-react';

export const InteractiveFeatureHero = () => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
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
            className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background"
        >
            {/* Advanced Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]"
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px]"
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, -30, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />

                {/* Mouse Follower Spotlight */}
                <motion.div
                    className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"
                    style={{
                        x: useTransform(mouseX, [0, 1], [-250, 250]),
                        y: useTransform(mouseY, [0, 1], [-250, 250]),
                        opacity: useTransform(mouseX, [0, 1], [0.2, 0.4]),
                    }}
                />

                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-highlight border border-border backdrop-blur-md mb-8 hover:bg-surface-highlight/80 transition-colors cursor-default"
                    >
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-text-secondary">Premium Feature Suite</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl md:text-8xl font-bold text-text mb-8 tracking-tight leading-tight font-display"
                    >
                        Power Beyond <br />
                        <span className="relative inline-block">
                            <span className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent blur-2xl opacity-30" />
                            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                Imagination
                            </span>
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-16 leading-relaxed"
                    >
                        Experience the next evolution of document intelligence.
                        Every tool you need, supercharged by advanced AI.
                    </motion.p>

                    {/* Floating Feature Icons with Parallax */}
                    <div className="relative h-40 hidden md:block">
                        {[
                            { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', delay: 0, x: -250, y: -20 },
                            { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', delay: 0.1, x: -80, y: 20 },
                            { icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10', delay: 0.2, x: 80, y: -30 },
                            { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', delay: 0.3, x: 250, y: 10 },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                style={{
                                    x: useTransform(mouseX, [0, 1], [item.x - 20, item.x + 20]),
                                    y: useTransform(mouseY, [0, 1], [item.y - 20, item.y + 20]),
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.6 + item.delay }}
                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-3xl ${item.bg} border border-border backdrop-blur-xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 cursor-pointer`}
                            >
                                <item.icon className={`w-10 h-10 ${item.color}`} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
            >
                <span className="text-text-muted text-xs font-bold uppercase tracking-[0.2em]">Explore Features</span>
                <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-text-muted/50 to-transparent">
                    <motion.div
                        animate={{ y: [0, 64, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-1/2 bg-gradient-to-b from-primary to-secondary"
                    />
                </div>
            </motion.div>
        </section>
    );
};
