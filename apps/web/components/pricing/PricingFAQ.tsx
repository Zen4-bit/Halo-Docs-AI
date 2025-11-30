'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const faqs = [
    {
        question: "Can I cancel my subscription at any time?",
        answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period. We believe in freedom, not lock-ins."
    },
    {
        question: "Is there a free trial available?",
        answer: "Absolutely! We offer a 14-day free trial on our Pro plan. No credit card required to start. You can experience the full power of HALO AI before making a commitment."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and wire transfers for Enterprise plans. All payments are processed securely through Stripe."
    },
    {
        question: "Is my data secure?",
        answer: "Security is our top priority. We use bank-level 256-bit encryption and are SOC 2 Type II compliant. Your data is encrypted at rest and in transit, and we never use it to train our public models without your explicit permission."
    },
    {
        question: "Do you offer discounts for non-profits or students?",
        answer: "Yes, we're proud to support education and non-profits. We offer special pricing with up to 50% off for eligible organizations. Please contact our sales team with your credentials."
    }
];

export const PricingFAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-32 bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md mb-6">
                        <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">Support</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <p className="text-lg text-slate-600 dark:text-white/60 max-w-2xl mx-auto">
                        Everything you need to know about our pricing, billing, and security. Can't find the answer you're looking for? <a href="/contact" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors underline decoration-purple-400/30 underline-offset-4">Contact our support team.</a>
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Card
                                variant="glass"
                                className={`group border rounded-2xl overflow-hidden transition-all duration-500 p-0 ${openIndex === index ? 'bg-slate-50 dark:bg-white/10 border-purple-500/30 shadow-lg shadow-purple-500/10' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/8 hover:border-slate-300 dark:hover:border-white/10'}`}
                                hoverEffect={false}
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full flex items-center justify-between p-6 md:p-8 text-left transition-colors relative overflow-hidden"
                                >
                                    {openIndex === index && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-50" />
                                    )}
                                    <span className={`relative z-10 text-lg md:text-xl font-medium transition-colors ${openIndex === index ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                        {faq.question}
                                    </span>
                                    <div className={`relative z-10 flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${openIndex === index ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rotate-180 shadow-lg shadow-purple-500/30' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 group-hover:bg-slate-200 dark:group-hover:bg-white/20 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                        {openIndex === index ? (
                                            <Minus className="w-4 h-4" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="p-6 md:p-8 pt-0 text-slate-600 dark:text-white/60 leading-relaxed text-base md:text-lg border-t border-slate-200 dark:border-white/5 relative">
                                                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-30 pointer-events-none" />
                                                <div className="relative z-10 flex gap-4">
                                                    <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                                                    {faq.answer}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
