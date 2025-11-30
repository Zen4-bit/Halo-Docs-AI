'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Lightbulb, Rocket, ArrowRight, Compass } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const MissionVision = () => {
    return (
        <section className="py-32 bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    {/* Mission Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute -left-12 -top-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />

                        <Card
                            variant="glass"
                            className="relative rounded-[2.5rem] p-10 md:p-12 overflow-hidden group hover:border-primary/30 transition-colors duration-500"
                            hoverEffect={false}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                                    <Target className="w-10 h-10 text-primary" />
                                </div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                                    <Compass className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Our Mission</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-text mb-6 leading-tight font-display">
                                    Democratizing <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Intelligence</span>
                                </h2>
                                <p className="text-xl text-text-secondary leading-relaxed mb-8">
                                    We believe that powerful AI tools shouldn't be reserved for tech giants. We're making them accessible, intuitive, and secure for everyone—from freelancers to Fortune 500s.
                                </p>
                                <button className="group flex items-center gap-2 text-text font-bold hover:text-primary transition-colors">
                                    Read our manifesto
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Vision Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <Card
                            variant="default"
                            className="group p-8 rounded-[2rem] hover:bg-surface-highlight transition-all duration-300 hover:border-secondary/30"
                            hoverEffect={true}
                        >
                            <div className="flex gap-6">
                                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border border-secondary/20">
                                    <Lightbulb className="w-8 h-8 text-secondary" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-text mb-3 group-hover:text-secondary transition-colors">Innovation First</h3>
                                    <p className="text-text-secondary text-lg leading-relaxed">
                                        We don't just follow trends; we set them. Our R&D team is constantly pushing the boundaries of what's possible with Large Language Models and Computer Vision.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card
                            variant="default"
                            className="group p-8 rounded-[2rem] hover:bg-surface-highlight transition-all duration-300 hover:border-accent/30"
                            hoverEffect={true}
                        >
                            <div className="flex gap-6">
                                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border border-accent/20">
                                    <Rocket className="w-8 h-8 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-text mb-3 group-hover:text-accent transition-colors">Speed & Scale</h3>
                                    <p className="text-text-secondary text-lg leading-relaxed">
                                        Built on a global edge network, HALO AI delivers lightning-fast processing speeds regardless of where you are or how much data you throw at it.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
