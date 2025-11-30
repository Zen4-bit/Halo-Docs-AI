'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Check, X, Zap, Shield, Star, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const plans = [
    {
        name: "Starter",
        price: "0",
        period: "/mo",
        description: "Perfect for individuals exploring AI document tools.",
        features: [
            "50 Documents / month",
            "Basic AI Summaries",
            "Standard PDF Tools",
            "Email Support",
            "1 User"
        ],
        notIncluded: [
            "Advanced AI Analysis",
            "API Access",
            "Team Collaboration",
            "Custom Workflows"
        ],
        icon: Zap,
        color: "blue",
        cta: "Get Started Free",
        popular: false
    },
    {
        name: "Pro",
        price: "29",
        period: "/mo",
        description: "For professionals who need power and precision.",
        features: [
            "Unlimited Documents",
            "Advanced AI Analysis",
            "All PDF Tools",
            "Priority Support",
            "5 Users",
            "API Access (Limited)",
            "Custom Workflows"
        ],
        notIncluded: [
            "Dedicated Account Manager",
            "SSO & Audit Logs"
        ],
        icon: Star,
        color: "purple",
        cta: "Start Free Trial",
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Tailored solutions for large organizations.",
        features: [
            "Unlimited Everything",
            "Dedicated Account Manager",
            "SSO & Audit Logs",
            "Custom AI Model Training",
            "On-premise Deployment",
            "24/7 Phone Support",
            "SLA Guarantees"
        ],
        notIncluded: [],
        icon: Shield,
        color: "pink",
        cta: "Contact Sales",
        popular: false
    }
];

const PricingCard = ({ plan, isAnnual, index }: { plan: any, isAnnual: boolean, index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="h-full"
        >
            <Card
                variant={plan.popular ? 'gradient' : 'glass'}
                className={`relative h-full p-8 flex flex-col ${plan.popular ? 'border-purple-500/50 shadow-2xl shadow-purple-500/10' : 'border-slate-200 dark:border-white/10'}`}
                hoverEffect={true}
            >
                {plan.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg shadow-purple-500/40 flex items-center gap-1.5 tracking-wide uppercase relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                            <Sparkles className="w-3 h-3 fill-white relative z-10" />
                            <span className="relative z-10">Most Popular</span>
                        </div>
                    </div>
                )}

                <div className="mb-8 pt-4 relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${plan.color}-500/20 to-${plan.color}-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-${plan.color}-500/10`}>
                        <plan.icon className={`w-8 h-8 text-${plan.color}-500 dark:text-${plan.color}-400`} />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-500 dark:text-white/50 text-sm h-10 leading-relaxed font-medium">{plan.description}</p>
                </div>

                <div className="mb-8 p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/10 transition-colors relative z-10">
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {plan.price === "Custom" ? "Custom" : `$${isAnnual ? (Number(plan.price) * 0.8).toFixed(0) : plan.price}`}
                        </span>
                        {plan.price !== "Custom" && <span className="text-slate-500 dark:text-white/50 font-medium">{plan.period}</span>}
                    </div>
                    {isAnnual && plan.price !== "Custom" && (
                        <p className="text-green-500 dark:text-green-400 text-xs mt-2 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
                            Billed annually
                        </p>
                    )}
                </div>

                <div className="flex-1 space-y-5 mb-10 relative z-10">
                    <p className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">What's Included</p>
                    {plan.features.map((feature: string) => (
                        <div key={feature} className="flex items-start gap-3 group/item">
                            <div className={`mt-0.5 w-5 h-5 rounded-full bg-${plan.color}-500/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-${plan.color}-500/20 transition-colors`}>
                                <Check className={`w-3 h-3 text-${plan.color}-500 dark:text-${plan.color}-400`} />
                            </div>
                            <span className="text-slate-600 dark:text-white/80 text-sm font-medium group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">{feature}</span>
                        </div>
                    ))}
                    {plan.notIncluded.map((feature: string) => (
                        <div key={feature} className="flex items-start gap-3 opacity-40 grayscale">
                            <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                                <X className="w-3 h-3 text-slate-400 dark:text-white/50" />
                            </div>
                            <span className="text-slate-500 dark:text-white/60 text-sm font-medium">{feature}</span>
                        </div>
                    ))}
                </div>

                <Link href={plan.price === "Custom" ? "/contact" : "/dashboard"} className="block mt-auto relative z-10">
                    <Button
                        variant={plan.popular ? 'glow' : 'primary'}
                        className="w-full py-6 text-lg"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                        {plan.cta}
                    </Button>
                </Link>
            </Card>
        </motion.div>
    );
};

export const PricingTiers = () => {
    const [isAnnual, setIsAnnual] = useState(true);

    return (
        <section className="pb-32 bg-background relative z-10">
            <div className="container mx-auto px-4">
                {/* Toggle */}
                <div className="flex justify-center mb-20">
                    <div className="bg-slate-100 dark:bg-white/5 p-1.5 rounded-full flex items-center relative border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-xl">
                        <motion.div
                            className="absolute top-1.5 bottom-1.5 rounded-full bg-white dark:bg-gradient-to-r dark:from-purple-500 dark:to-blue-500 shadow-sm dark:shadow-lg dark:shadow-purple-500/25"
                            initial={false}
                            animate={{
                                x: isAnnual ? '100%' : '0%',
                                width: '50%'
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-300 ${!isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-300 flex items-center gap-2 ${isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Annual
                            <motion.span
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                                className="text-[10px] font-extrabold bg-purple-100 dark:bg-white text-purple-600 px-2 py-0.5 rounded-full shadow-sm"
                            >
                                -20%
                            </motion.span>
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan, index) => (
                        <PricingCard key={plan.name} plan={plan} isAnnual={isAnnual} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};
