'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const testimonials = [
    {
        name: 'Sarah Chen',
        role: 'Product Manager',
        company: 'TechCorp',
        avatar: '👩‍💼',
        rating: 5,
        quote: 'HALO AI has transformed our document workflow. The AI summarization saves us hours every week. It\'s like having a super-smart assistant on standby 24/7.',
    },
    {
        name: 'Michael Rodriguez',
        role: 'Legal Counsel',
        company: 'Law Firm LLP',
        avatar: '👨‍⚖️',
        rating: 5,
        quote: 'The AI redaction feature is incredible. Fast, accurate, and compliant with all our requirements. It has completely streamlined our due diligence process.',
    },
    {
        name: 'Emily Watson',
        role: 'Content Director',
        company: 'Media Co',
        avatar: '👩‍💻',
        rating: 5,
        quote: 'Best document intelligence platform we\'ve used. The translation quality is outstanding, and the interface is a joy to use. Highly recommended!',
    },
];



export default function Testimonials() {
    return (
        <section className="py-32 bg-background relative overflow-hidden">
            {/* Advanced Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-3xl"
                    style={{ willChange: 'transform, opacity' }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
            </div>

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 bg-surface-highlight border border-border rounded-full px-4 py-2 mb-8 backdrop-blur-md">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-text-secondary text-sm font-medium">Customer Stories</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-text mb-8 tracking-tight">
                        Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">Professionals</span>
                    </h2>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                        Join thousands of teams who rely on HALO AI for their document intelligence needs.
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-32">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -10 }}
                            className="relative group"
                        >
                            {/* Card Glow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <Card
                                variant="glass"
                                className="relative h-full rounded-[2rem] p-10 hover:bg-surface transition-all duration-300 flex flex-col"
                                hoverEffect={false}
                            >
                                {/* Quote Icon */}
                                <div className="absolute top-8 right-8 opacity-20 group-hover:opacity-40 transition-opacity transform group-hover:scale-110 duration-300">
                                    <Quote className="w-12 h-12 text-primary" />
                                </div>

                                {/* Rating */}
                                <div className="flex gap-1 mb-6">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-text text-lg leading-relaxed mb-8 flex-grow">
                                    "{testimonial.quote}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-4 pt-8 border-t border-border">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-pink-500 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="text-text font-bold text-lg">{testimonial.name}</div>
                                        <div className="text-text-muted text-sm flex items-center gap-1">
                                            {testimonial.role}
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            {testimonial.company}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
