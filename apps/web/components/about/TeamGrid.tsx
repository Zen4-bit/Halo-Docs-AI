'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Github, Linkedin, Twitter, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const team = [
    {
        name: "Alex Chen",
        role: "Founder & CEO",
        bio: "Ex-Google AI researcher with a passion for democratizing machine learning.",
        image: "bg-gradient-to-br from-purple-500 to-indigo-500",
        socials: { twitter: "#", linkedin: "#" }
    },
    {
        name: "Sarah Johnson",
        role: "CTO",
        bio: "Systems architect who scaled infrastructure for 100M+ users at TechCorp.",
        image: "bg-gradient-to-br from-pink-500 to-rose-500",
        socials: { github: "#", linkedin: "#" }
    },
    {
        name: "Marcus Williams",
        role: "Head of Product",
        bio: "Design-obsessed product leader focused on intuitive user experiences.",
        image: "bg-gradient-to-br from-blue-500 to-cyan-500",
        socials: { twitter: "#", linkedin: "#" }
    },
    {
        name: "Dr. Emily Zhang",
        role: "Lead AI Scientist",
        bio: "PhD in NLP from Stanford. Leading our core model development.",
        image: "bg-gradient-to-br from-emerald-500 to-teal-500",
        socials: { github: "#", twitter: "#" }
    }
];

export const TeamGrid = () => {
    return (
        <section className="py-32 bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"
            />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-highlight border border-border backdrop-blur-md mb-8">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-text-secondary">Our Team</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold text-text mb-6 tracking-tight font-display">
                        Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Minds</span>
                    </h2>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                        A diverse team of researchers, engineers, and designers united by a single mission.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {team.map((member, index) => (
                        <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Card
                                variant="glass"
                                className="group relative rounded-[2rem] overflow-hidden transition-all duration-500 hover:bg-surface-highlight hover:shadow-2xl hover:shadow-primary/10 p-0"
                                hoverEffect={true}
                            >
                                {/* Avatar Area */}
                                <div className={`h-72 w-full ${member.image} relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />

                                    {/* Social Overlay */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                                        {member.socials.twitter && (
                                            <a href={member.socials.twitter} className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all duration-300">
                                                <Twitter className="w-4 h-4" />
                                            </a>
                                        )}
                                        {member.socials.linkedin && (
                                            <a href={member.socials.linkedin} className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all duration-300">
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                        {member.socials.github && (
                                            <a href={member.socials.github} className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all duration-300">
                                                <Github className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                        <h3 className="text-2xl font-bold text-text mb-1">{member.name}</h3>
                                        <p className="text-primary font-medium text-sm tracking-wide uppercase">{member.role}</p>
                                    </div>
                                </div>

                                <div className="p-8 pt-2 relative">
                                    <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
                                    <p className="text-text-secondary text-sm leading-relaxed mb-6">
                                        {member.bio}
                                    </p>

                                    <div className="flex items-center gap-2 text-xs font-medium text-text-muted group-hover:text-text transition-colors cursor-pointer">
                                        <span>View Profile</span>
                                        <ArrowUpRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
