'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Heart, Globe, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const values = [
    {
        title: "Uncompromised Security",
        description: "We treat your data with the highest level of care. Enterprise-grade encryption and strict privacy protocols are baked into our DNA.",
        icon: Shield,
        color: "text-green-400",
        gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
        title: "User-Obsessed",
        description: "We build for the human behind the screen. Every feature is crafted to reduce friction and spark joy in your daily workflow.",
        icon: Heart,
        color: "text-red-400",
        gradient: "from-red-500/20 to-rose-500/20"
    },
    {
        title: "Global Impact",
        description: "Intelligence knows no borders. We support 100+ languages to ensure our tools empower creators and businesses worldwide.",
        icon: Globe,
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
        title: "Relentless Innovation",
        description: "Good enough isn't in our vocabulary. We ship fast, iterate constantly, and always aim for the bleeding edge of AI.",
        icon: Zap,
        color: "text-yellow-400",
        gradient: "from-yellow-500/20 to-amber-500/20"
    }
];

export const ValuesSection = () => {
    return (
        <section className="py-32 bg-background relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />

            {/* Ambient Light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <h2 className="text-4xl md:text-6xl font-bold text-text mb-6 tracking-tight font-display">
                        Our Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Values</span>
                    </h2>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                        The principles that guide every line of code we write and every decision we make.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {values.map((value, index) => (
                        <ValueCard key={value.title} value={value} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const ValueCard = ({ value, index }: { value: any, index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
        >
            <Card
                variant="glass"
                className="group relative rounded-[2rem] p-10 overflow-hidden h-full"
                hoverEffect={true}
            >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-border`}>
                        <value.icon className={`w-8 h-8 ${value.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-text mb-4">{value.title}</h3>
                    <p className="text-text-secondary text-lg leading-relaxed">
                        {value.description}
                    </p>
                </div>
            </Card>
        </motion.div>
    );
};
