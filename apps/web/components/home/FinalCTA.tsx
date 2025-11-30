'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, Shield, Star } from 'lucide-react';

export default function FinalCTA() {
    return (
        <section className="relative py-32 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-background">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-20 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="relative glass-card border border-border rounded-[3rem] p-12 md:p-24 overflow-hidden text-center">
                    {/* Inner Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-surface-highlight to-transparent pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="relative z-10"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-highlight border border-border backdrop-blur-md mb-8 hover:bg-surface transition-colors cursor-default">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-text-secondary">Start Your Journey Today</span>
                        </div>

                        <h2 className="text-5xl md:text-7xl font-bold text-text mb-8 leading-tight tracking-tight">
                            Ready to Transform Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-blue-500">
                                Document Workflow?
                            </span>
                        </h2>

                        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
                            Join thousands of professionals using HALO AI to automate workflows,
                            save time, and unlock the power of their documents.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                            <Link href="/dashboard">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-primary to-pink-500 rounded-xl font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 flex items-center gap-2"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </Link>
                            <Link href="/contact">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-surface-highlight border border-border rounded-xl font-bold text-text hover:bg-surface transition-all duration-300"
                                >
                                    Contact Sales
                                </motion.button>
                            </Link>
                        </div>

                        {/* Stats/Trust */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-border pt-12 max-w-3xl mx-auto">
                            {[
                                { icon: Zap, label: "Processing Speed", value: "10x Faster" },
                                { icon: Shield, label: "Enterprise Security", value: "SOC 2 Type II" },
                                { icon: Star, label: "User Rating", value: "4.9/5.0" },
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className="p-2 rounded-full bg-surface-highlight mb-2">
                                        <stat.icon className="w-5 h-5 text-text-muted" />
                                    </div>
                                    <div className="text-2xl font-bold text-text">{stat.value}</div>
                                    <div className="text-sm text-text-muted">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
