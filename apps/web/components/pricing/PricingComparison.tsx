'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, HelpCircle, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const features = [
    {
        category: "Core Features",
        items: [
            { name: "Document Processing", starter: "50/mo", pro: "Unlimited", enterprise: "Unlimited" },
            { name: "File Size Limit", starter: "10MB", pro: "100MB", enterprise: "5GB" },
            { name: "Storage", starter: "1GB", pro: "100GB", enterprise: "Unlimited" },
            { name: "OCR Support", starter: true, pro: true, enterprise: true },
            { name: "Mobile App Access", starter: true, pro: true, enterprise: true },
        ]
    },
    {
        category: "Advanced AI",
        items: [
            { name: "AI Summarization", starter: "Basic", pro: "Advanced", enterprise: "Custom Models" },
            { name: "Smart Data Extraction", starter: false, pro: true, enterprise: true },
            { name: "Sentiment Analysis", starter: false, pro: true, enterprise: true },
            { name: "Multi-language Support", starter: "5 Languages", pro: "50+ Languages", enterprise: "All Languages" },
            { name: "Custom AI Workflows", starter: false, pro: true, enterprise: true },
        ]
    },
    {
        category: "Security & Control",
        items: [
            { name: "Data Encryption", starter: "Standard", pro: "Advanced", enterprise: "Bank-grade" },
            { name: "SSO (Single Sign-On)", starter: false, pro: false, enterprise: true },
            { name: "Audit Logs", starter: false, pro: false, enterprise: true },
            { name: "Role-Based Access", starter: false, pro: "Basic", enterprise: "Granular" },
            { name: "Dedicated Instance", starter: false, pro: false, enterprise: true },
        ]
    },
    {
        category: "Support",
        items: [
            { name: "Support Channel", starter: "Email", pro: "Priority Email & Chat", enterprise: "24/7 Phone & Dedicated Agent" },
            { name: "Response Time", starter: "48h", pro: "4h", enterprise: "1h" },
            { name: "Onboarding Training", starter: false, pro: false, enterprise: true },
        ]
    }
];

const plans = [
    { name: "Starter", color: "text-blue-400" },
    { name: "Pro", color: "text-purple-400" },
    { name: "Enterprise", color: "text-pink-400" }
];

export const PricingComparison = () => {
    return (
        <section className="py-20 bg-background relative z-10">
            <div className="container mx-auto px-4 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Compare Plans</h2>
                    <p className="text-slate-500 dark:text-white/60">Detailed breakdown of features and capabilities.</p>
                </motion.div>

                <div className="overflow-x-auto pb-4">
                    <div className="min-w-[800px]">
                        {/* Header */}
                        <div className="grid grid-cols-4 gap-4 mb-8 px-6">
                            <div className="font-bold text-slate-900 dark:text-white text-lg">Features</div>
                            {plans.map((plan) => (
                                <div key={plan.name} className={`font-bold text-xl text-center ${plan.color}`}>
                                    {plan.name}
                                </div>
                            ))}
                        </div>

                        {/* Categories */}
                        <div className="space-y-8">
                            {features.map((category, catIndex) => (
                                <motion.div
                                    key={category.category}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: catIndex * 0.1 }}
                                >
                                    <Card variant="glass" className="rounded-3xl overflow-hidden p-0 border-slate-200 dark:border-white/10" hoverEffect={false}>
                                        <div className="bg-slate-50 dark:bg-white/5 px-6 py-4 border-b border-slate-200 dark:border-white/10">
                                            <h3 className="font-bold text-slate-900 dark:text-white">{category.category}</h3>
                                        </div>
                                        <div className="divide-y divide-slate-200 dark:divide-white/5">
                                            {category.items.map((item, itemIndex) => (
                                                <div key={item.name} className="grid grid-cols-4 gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-white/80 font-medium">
                                                        {item.name}
                                                        <div className="group/tooltip relative">
                                                            <Info className="w-4 h-4 text-slate-400 dark:text-white/20 group-hover:text-slate-600 dark:group-hover:text-white/60 transition-colors cursor-help" />
                                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-800 dark:bg-black/90 border border-slate-700 dark:border-white/10 rounded-lg text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                                                                Detailed info about {item.name}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Starter Value */}
                                                    <div className="flex items-center justify-center text-slate-500 dark:text-white/60">
                                                        {typeof item.starter === 'boolean' ? (
                                                            item.starter ? <Check className="w-5 h-5 text-blue-500 dark:text-blue-400" /> : <Minus className="w-5 h-5 text-slate-300 dark:text-white/20" />
                                                        ) : (
                                                            <span className="text-sm">{item.starter}</span>
                                                        )}
                                                    </div>

                                                    {/* Pro Value */}
                                                    <div className="flex items-center justify-center text-slate-900 dark:text-white font-medium">
                                                        {typeof item.pro === 'boolean' ? (
                                                            item.pro ? <Check className="w-5 h-5 text-purple-500 dark:text-purple-400" /> : <Minus className="w-5 h-5 text-slate-300 dark:text-white/20" />
                                                        ) : (
                                                            <span className="text-sm">{item.pro}</span>
                                                        )}
                                                    </div>

                                                    {/* Enterprise Value */}
                                                    <div className="flex items-center justify-center text-slate-900 dark:text-white font-bold">
                                                        {typeof item.enterprise === 'boolean' ? (
                                                            item.enterprise ? <Check className="w-5 h-5 text-pink-500 dark:text-pink-400" /> : <Minus className="w-5 h-5 text-slate-300 dark:text-white/20" />
                                                        ) : (
                                                            <span className="text-sm">{item.enterprise}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
