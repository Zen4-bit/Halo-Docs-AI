'use client';

import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { Mail, MessageSquare, Phone, ArrowRight, Globe, Clock, Zap, Shield, Headphones } from 'lucide-react';

const HolographicCard = ({ children, className, color = "blue" }: { children: React.ReactNode, className?: string, color?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set((clientX - left) / width - 0.5);
        y.set((clientY - top) / height - 0.5);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY: useMotionTemplate`${mouseX}deg`,
                rotateX: useMotionTemplate`${mouseY}deg`, // Inverted for natural feel
                transformStyle: "preserve-3d",
            }}
            className={`group relative perspective-1000 ${className}`}
        >
            <div
                className={`relative h-full bg-[#0f1629]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 overflow-hidden transition-all duration-300 group-hover:border-${color}-500/30 group-hover:shadow-2xl group-hover:shadow-${color}-500/10`}
                style={{ transform: "translateZ(20px)" }}
            >
                {/* Holographic Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

                <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

export const ContactHero = () => {
    return (
        <section className="relative py-32 bg-[#0b0f1c] overflow-hidden min-h-[80vh] flex flex-col justify-center">
            {/* Advanced Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid.svg')] opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default"
                    >
                        <Globe className="w-4 h-4 text-blue-400 animate-spin-slow" />
                        <span className="text-sm font-medium text-white/80">Global Support 24/7</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight"
                    >
                        Let's Start a <br />
                        <span className="relative inline-block">
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-2xl opacity-30" />
                            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
                                Conversation
                            </span>
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
                    >
                        Have questions about our enterprise solutions or need technical support?
                        We're here to help you transform your document workflows.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto perspective-2000">
                    {[
                        {
                            icon: MessageSquare,
                            title: "Chat with Sales",
                            desc: "Speak to our team about your needs",
                            action: "Start Chat",
                            color: "blue",
                            status: "Online Now",
                            badgeIcon: Zap
                        },
                        {
                            icon: Mail,
                            title: "Email Support",
                            desc: "Get help with technical issues",
                            action: "Send Email",
                            color: "purple",
                            status: "Response < 24h",
                            badgeIcon: Shield
                        },
                        {
                            icon: Phone,
                            title: "Call Us",
                            desc: "Mon-Fri from 8am to 5pm EST",
                            action: "+1 (555) 000-0000",
                            color: "pink",
                            status: "Open Now",
                            badgeIcon: Headphones
                        },
                    ].map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 50, rotateX: -10 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                        >
                            <HolographicCard color={item.color} className="h-full">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-${item.color}-500/20`}>
                                        <item.icon className={`w-8 h-8 text-${item.color}-400`} />
                                    </div>
                                    {item.status && (
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-${item.color}-500/10 border border-${item.color}-500/20`}>
                                            <span className={`relative flex h-2 w-2`}>
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${item.color}-400 opacity-75`}></span>
                                                <span className={`relative inline-flex rounded-full h-2 w-2 bg-${item.color}-500`}></span>
                                            </span>
                                            <span className={`text-xs font-bold text-${item.color}-400 uppercase tracking-wider`}>{item.status}</span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-white/60 text-sm mb-8 leading-relaxed font-medium">{item.desc}</p>

                                <div className="mt-auto">
                                    <button className={`w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-${item.color}-500/20 hover:border-${item.color}-500/30 transition-all duration-300 flex items-center justify-center gap-2 group/btn`}>
                                        <span className={`text-${item.color}-400 font-bold`}>{item.action}</span>
                                        <ArrowRight className={`w-4 h-4 text-${item.color}-400 group-hover/btn:translate-x-1 transition-transform`} />
                                    </button>
                                </div>
                            </HolographicCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
