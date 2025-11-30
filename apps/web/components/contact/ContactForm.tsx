'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, CheckCircle2, Sparkles, User, Mail, MessageSquare } from 'lucide-react';

export const ContactForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 5000);
    };

    return (
        <section className="pb-32 bg-[#0b0f1c] relative z-10">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-[2.5rem] opacity-20 blur-xl" />

                    <div className="relative bg-[#0f1629]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-16 overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                        <div className="text-center mb-16 relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Get in Touch</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Send us a Message</h2>
                            <p className="text-white/60 text-lg">We usually respond within 24 hours.</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8 relative">
                                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                                        <CheckCircle2 className="w-12 h-12 text-green-400 relative z-10" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-4">Message Sent!</h3>
                                    <p className="text-white/60 max-w-md mx-auto text-lg mb-8">
                                        Thank you for reaching out. We've received your message and will get back to you shortly.
                                    </p>
                                    <button
                                        onClick={() => setIsSuccess(false)}
                                        className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
                                    >
                                        Send another message
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-8 relative z-10"
                                >
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <InputField
                                            id="firstName"
                                            label="First Name"
                                            placeholder="John"
                                            icon={User}
                                            focusedField={focusedField}
                                            setFocusedField={setFocusedField}
                                        />
                                        <InputField
                                            id="lastName"
                                            label="Last Name"
                                            placeholder="Doe"
                                            icon={User}
                                            focusedField={focusedField}
                                            setFocusedField={setFocusedField}
                                        />
                                    </div>

                                    <InputField
                                        id="email"
                                        label="Email Address"
                                        placeholder="john@example.com"
                                        type="email"
                                        icon={Mail}
                                        focusedField={focusedField}
                                        setFocusedField={setFocusedField}
                                    />

                                    <div className="relative group">
                                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-0 transition duration-500 ${focusedField === 'message' ? 'opacity-30' : 'group-hover:opacity-10'}`} />
                                        <div className="relative">
                                            <textarea
                                                id="message"
                                                required
                                                rows={6}
                                                className="w-full bg-[#0b0f1c] border-2 border-white/10 rounded-2xl px-6 py-5 text-white placeholder-white/20 focus:outline-none focus:border-transparent focus:ring-0 transition-all resize-none font-normal leading-relaxed peer"
                                                placeholder="How can we help you?"
                                                onFocus={() => setFocusedField('message')}
                                                onBlur={() => setFocusedField(null)}
                                            />
                                            <label
                                                htmlFor="message"
                                                className="absolute left-6 top-5 text-white/40 text-sm transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-placeholder-shown:opacity-0 peer-focus:-top-3 peer-focus:opacity-100 peer-focus:text-xs peer-focus:text-purple-400 peer-focus:bg-[#0f1629] peer-focus:px-2 pointer-events-none"
                                            >
                                                Message
                                            </label>
                                            <MessageSquare className={`absolute right-6 top-6 w-5 h-5 transition-colors duration-300 ${focusedField === 'message' ? 'text-purple-400' : 'text-white/20'}`} />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Send Message</span>
                                                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const InputField = ({ id, label, placeholder, type = "text", icon: Icon, focusedField, setFocusedField }: any) => (
    <div className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-0 transition duration-500 ${focusedField === id ? 'opacity-30' : 'group-hover:opacity-10'}`} />
        <div className="relative">
            <input
                type={type}
                id={id}
                required
                className="w-full bg-[#0b0f1c] border-2 border-white/10 rounded-2xl px-6 py-5 text-white placeholder-white/20 focus:outline-none focus:border-transparent focus:ring-0 transition-all peer"
                placeholder={placeholder}
                onFocus={() => setFocusedField(id)}
                onBlur={() => setFocusedField(null)}
            />
            <label
                htmlFor={id}
                className="absolute left-6 top-5 text-white/40 text-sm transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-placeholder-shown:opacity-0 peer-focus:-top-3 peer-focus:opacity-100 peer-focus:text-xs peer-focus:text-purple-400 peer-focus:bg-[#0f1629] peer-focus:px-2 pointer-events-none"
            >
                {label}
            </label>
            <Icon className={`absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === id ? 'text-purple-400' : 'text-white/20'}`} />
        </div>
    </div>
);
