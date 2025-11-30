'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { Sparkles, ArrowDown, Globe, Zap, Rocket } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const AboutHero = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        mouseX.set((clientX - left) / width);
        mouseY.set((clientY - top) / height);
    }

    return (
        <section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background perspective-1000"
        >
            {/* Cosmic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />

                {/* Nebula Layers */}
                <motion.div
                    style={{ y: y1, x: useTransform(mouseX, [0, 1], [-50, 50]) }}
                    className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary/20 rounded-full blur-[150px] mix-blend-screen animate-pulse"
                />
                <motion.div
                    style={{ y: y2, x: useTransform(mouseX, [0, 1], [50, -50]) }}
                    className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-secondary/20 rounded-full blur-[150px] mix-blend-screen animate-pulse delay-1000"
                />
                <motion.div
                    className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[100px] mix-blend-screen animate-float"
                />

                {/* Starfield */}
                {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-text rounded-full"
                        initial={{
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%",
                            opacity: Math.random() * 0.7 + 0.3,
                            scale: Math.random() * 0.5 + 0.5,
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            opacity: [null, 0],
                        }}
                        transition={{
                            duration: Math.random() * 20 + 10,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-6xl mx-auto text-center">
                    {/* Floating Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, rotateX: 90 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-surface-highlight border border-border backdrop-blur-xl mb-12 hover:bg-surface-highlight/80 transition-all hover:scale-105 cursor-default shadow-lg shadow-primary/10"
                    >
                        <Rocket className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-sm font-bold text-text-secondary tracking-wide uppercase">The Next Evolution</span>
                    </motion.div>

                    {/* Main Title with 3D Effect */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative mb-12"
                    >
                        <h1 className="text-7xl md:text-9xl font-black text-text leading-none tracking-tighter mix-blend-overlay opacity-10 absolute inset-0 blur-sm select-none">
                            FUTURE
                        </h1>
                        <h1 className="text-6xl md:text-8xl font-bold text-text leading-tight tracking-tight relative z-10 font-display">
                            We're Building the <br />
                            <span className="relative inline-block group">
                                <span className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-x bg-[length:200%_auto]">
                                    Future of Intelligence
                                </span>
                                <Sparkles className="absolute -top-8 -right-8 w-12 h-12 text-yellow-400 animate-bounce delay-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                        </h1>
                    </motion.div>

                    {/* Description with Glass Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative max-w-3xl mx-auto"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-xl opacity-50" />
                        <div className="relative bg-surface/50 backdrop-blur-md border border-border rounded-3xl p-8 md:p-10">
                            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed font-light">
                                <span className="font-bold text-text">HALO AI</span> isn't just a tool; it's a <span className="text-primary">paradigm shift</span>.
                                Born from a vision to make document intelligence accessible, secure, and infinitely scalable.
                            </p>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto"
                    >
                        {[
                            { label: "Global Users", value: "100K+", icon: Globe, color: "blue" },
                            { label: "Documents Processed", value: "50M+", icon: Zap, color: "yellow" },
                            { label: "Uptime", value: "99.99%", icon: Sparkles, color: "purple" }
                        ].map((stat, index) => (
                            <Card
                                key={index}
                                variant="outline"
                                className="group relative bg-surface border border-border rounded-2xl p-6 hover:bg-surface-highlight transition-all duration-300"
                                hoverEffect={true}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} />
                                <stat.icon className={`w-8 h-8 text-${stat.color}-400 mb-4 mx-auto group-hover:scale-110 transition-transform`} />
                                <div className="text-3xl font-bold text-text mb-1">{stat.value}</div>
                                <div className="text-sm text-text-muted uppercase tracking-wider font-bold">{stat.label}</div>
                            </Card>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Explore</span>
                <div className="w-6 h-10 rounded-full border-2 border-text-muted/20 flex items-start justify-center p-1.5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-text-muted/10 to-transparent animate-shimmer" />
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-1.5 h-1.5 rounded-full bg-text shadow-[0_0_10px_rgba(var(--text),0.8)]"
                    />
                </div>
            </motion.div>
        </section>
    );
};
