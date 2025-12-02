'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Brain,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface StoryCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  story: string;
  stats: string;
  color: string;
}

const storyCards: StoryCard[] = [
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Document Intelligence",
    description: "AI that understands context, not just text",
    story: "Upload any document and get instant insights about risks, obligations, and opportunities.",
    stats: "99.8% Accuracy",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Smart Processing",
    description: "Machine learning that improves with every document",
    story: "Our AI learns from your workflow patterns, becoming more accurate and personalized over time.",
    stats: "2M+ Documents",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Lightning Automation",
    description: "Transform hours of work into seconds",
    story: "What used to take days now happens automatically while you focus on strategic decisions.",
    stats: "10,000+ Hours Saved",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance",
    story: "Sleep soundly knowing your documents are protected with military-grade security.",
    stats: "SOC 2 Certified",
    color: "from-green-500 to-emerald-500"
  }
];

export const SmoothStory: React.FC = memo(() => {
  const [activeCard, setActiveCard] = useState(0);

  // Auto-rotate cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % storyCards.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-16 md:py-24 lg:py-32 bg-background overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center space-x-2 bg-surface-highlight border border-border px-4 py-2 rounded-full text-sm font-medium text-text-secondary mb-8 backdrop-blur-md">
            <Brain className="w-4 h-4 text-primary" />
            <span>The Story Behind the Technology</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-text mb-4 md:mb-6 leading-tight tracking-tight">
            Every Document Has a<br className="hidden sm:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              Story to Tell
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed px-2">
            We don't just process documents—we understand their stories, extract their insights,
            and transform them into actionable intelligence.
          </p>
        </motion.div>

        {/* Interactive Story Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-10 md:mb-20">
          {/* Left Side - Feature List */}
          <div className="space-y-4">
            {storyCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => setActiveCard(index)}
                className={`group cursor-pointer rounded-xl md:rounded-[2rem] p-4 md:p-6 transition-all duration-500 border ${activeCard === index
                  ? 'bg-surface border-primary/20 shadow-2xl shadow-primary/5'
                  : 'bg-transparent border-transparent hover:bg-surface-highlight'
                  }`}
              >
                <div className="flex items-start space-x-4 md:space-x-6">
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${activeCard === index
                    ? `bg-gradient-to-br ${card.color} shadow-lg text-white`
                    : 'bg-surface-highlight text-text-muted'
                    }`}>
                    <div>
                      {card.icon}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className={`text-base md:text-xl font-bold mb-1 md:mb-2 transition-colors ${activeCard === index ? 'text-text' : 'text-text-secondary'}`}>
                      {card.title}
                    </h3>
                    <p className={`text-sm leading-relaxed transition-colors ${activeCard === index ? 'text-text-secondary' : 'text-text-muted'}`}>
                      {card.description}
                    </p>

                    <motion.div
                      initial={false}
                      animate={{
                        height: activeCard === index ? 'auto' : 0,
                        opacity: activeCard === index ? 1 : 0,
                        marginTop: activeCard === index ? 16 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center space-x-2 text-primary">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-bold">{card.stats}</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Side - Visual Display */}
          <div className="relative lg:h-[600px] flex items-center mt-8 lg:mt-0">
            <div className="relative w-full">
              {storyCards[activeCard] && (
                <>
                  <motion.div
                    key={activeCard}
                    initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 glass-card border border-border rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl"
                  >
                    {/* Card Content */}
                    <div className="text-center mb-10">
                      <div className={`w-14 h-14 md:w-20 md:h-20 mx-auto rounded-2xl md:rounded-3xl bg-gradient-to-br ${storyCards[activeCard].color} flex items-center justify-center shadow-lg mb-4 md:mb-6`}>
                        <div className="text-white">
                          {storyCards[activeCard].icon}
                        </div>
                      </div>
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-text mb-3 md:mb-4">{storyCards[activeCard].title}</h3>
                      <p className="text-text-secondary text-sm md:text-base lg:text-lg leading-relaxed">{storyCards[activeCard].story}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4 border-t border-border pt-6 md:pt-8">
                      {[
                        { icon: Clock, value: "24/7", label: "Available" },
                        { icon: CheckCircle, value: "100%", label: "Reliable" },
                        { icon: Users, value: "50K+", label: "Users" }
                      ].map((stat, i) => (
                        <div key={i} className="text-center">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-surface-highlight rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3 text-text-secondary">
                            <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                          <div className="text-text font-bold text-base md:text-lg">{stat.value}</div>
                          <div className="text-text-muted text-xs uppercase tracking-wider">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Decorative Elements */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${storyCards[activeCard].color} rounded-full blur-[60px] opacity-20 transition-colors duration-500`} />
                  <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br ${storyCards[activeCard].color} rounded-full blur-[60px] opacity-20 transition-colors duration-500`} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/dashboard">
            <button className="btn btn-primary rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 text-base md:text-lg shadow-xl hover:shadow-2xl">
              <span className="relative flex items-center gap-2">
                Start Your Story
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
});

SmoothStory.displayName = 'SmoothStory';
