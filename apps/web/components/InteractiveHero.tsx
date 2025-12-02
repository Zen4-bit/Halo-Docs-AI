'use client';

import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import Link from 'next/link';
import { motion, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Brain, Globe, Layers, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { globalMouseX, globalMouseY } from '@/lib/unified-raf';

// --- Utility Components ---

const TiltCard = memo(({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Use global mouse for tilt to avoid layout thrashing
  // We map global 0-1 coordinates to tilt angles
  const rotateX = useTransform(globalMouseY, [0, 1], ["5deg", "-5deg"]);
  const rotateY = useTransform(globalMouseX, [0, 1], ["-5deg", "5deg"]);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className={className}
    >
      <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
      {/* Simplified gloss effect */}
      <div
        className="absolute inset-0 rounded-[3rem] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 45%, transparent 50%)",
          transform: "translateZ(1px)"
        }}
      />
    </motion.div>
  );
});

TiltCard.displayName = 'TiltCard';

const MagneticButton = memo(({ children, href }: { children: React.ReactNode; href?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Keep local listener for magnetic effect as it needs element-relative coordinates
    // But optimize by not doing heavy calcs
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;
    x.set(mouseXFromCenter * 0.5);
    y.set(mouseYFromCenter * 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: mouseX, y: mouseY }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
});

MagneticButton.displayName = 'MagneticButton';

const stories = [
  {
    title: "Transform Documents",
    subtitle: "AI-powered processing that understands your content",
    icon: <Brain className="w-8 h-8" />,
    color: "from-indigo-500 to-purple-500",
    bg: "bg-indigo-500/10"
  },
  {
    title: "Automate Workflows",
    subtitle: "Streamline operations with intelligent automation",
    icon: <Zap className="w-8 h-8" />,
    color: "from-violet-500 to-fuchsia-500",
    bg: "bg-violet-500/10"
  },
  {
    title: "Global Collaboration",
    subtitle: "Connect teams worldwide with seamless document sharing",
    icon: <Globe className="w-8 h-8" />,
    color: "from-cyan-500 to-blue-500",
    bg: "bg-cyan-500/10"
  },
  {
    title: "Multi-Layer Security",
    subtitle: "Enterprise-grade protection for your sensitive data",
    icon: <Layers className="w-8 h-8" />,
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-500/10"
  }
];

export const InteractiveHero: React.FC = memo(() => {
  const [currentStory, setCurrentStory] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mount tracking to prevent SSR/hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-rotate stories
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStory((prev) => (prev + 1) % stories.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center perspective-1000 py-12 md:py-20"
    >
      {/* 3D Parallax Background System Removed */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-10" />
      </div>

      {/* Show simple fallback during mount */}
      {!isMounted && (
        <div className="relative z-20 container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-text mb-4 md:mb-6">
            HALO <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">AI</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-text-secondary max-w-3xl mx-auto px-4">
            Next-Gen Document Intelligence Platform
          </p>
        </div>
      )}

      {/* Content */}
      {isMounted && (<div className="relative z-20 container mx-auto px-4 text-center">
        {/* Main Story Display with Enhanced 3D Tilt */}
        <div className="relative min-h-[280px] sm:min-h-[340px] md:min-h-[400px] mb-8 md:mb-12 perspective-1000">
          <AnimatePresence mode="wait">
            {(() => {
              const story = stories[currentStory];
              if (!story) return null;

              return (
                <motion.div
                  key={currentStory}
                  initial={{ opacity: 0, scale: 0.8, rotateX: 20, z: -100 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0, z: 0 }}
                  exit={{ opacity: 0, scale: 1.1, rotateX: -20, z: 100 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <TiltCard className="group relative p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl md:rounded-[3rem] glass-card border border-white/10 shadow-2xl mx-2">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br ${story.color} flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-4 md:mb-8 mx-auto transform group-hover:scale-110 transition-transform duration-500`}>
                      {story.icon}
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold text-text mb-3 md:mb-6 leading-tight tracking-tight">
                      {story.title.split(' ').map((word: string, i: number) => (
                        <span key={i} className="inline-block mr-4">
                          {i === 1 ? (
                            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${story.color} animate-gradient`}>
                              {word}
                            </span>
                          ) : (
                            word
                          )}
                        </span>
                      ))}
                    </h1>

                    <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed px-2">
                      {story.subtitle}
                    </p>
                  </TiltCard>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Story Indicators */}
        <div className="flex items-center justify-center space-x-3 md:space-x-4 mb-8 md:mb-16">
          {stories.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentStory(index)}
              className={`h-2 rounded-full transition-all duration-500 ${index === currentStory
                ? 'w-12 bg-gradient-to-r from-primary to-secondary shadow-glow-brand'
                : 'w-2 bg-surface-highlight hover:bg-primary/50'
                }`}
            />
          ))}
        </div>

        {/* CTA Buttons with Magnetic Effect */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center px-4"
        >
          <MagneticButton href="/dashboard">
            <Button variant="primary" size="lg" className="rounded-xl md:rounded-2xl px-6 py-4 md:px-10 md:py-7 text-base md:text-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto" rightIcon={<ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />}>
              Start Your Journey
            </Button>
          </MagneticButton>

          <MagneticButton href="/tools">
            <Button variant="secondary" size="lg" className="rounded-xl md:rounded-2xl px-6 py-4 md:px-10 md:py-7 text-base md:text-xl hover:bg-surface-highlight/80 w-full sm:w-auto" rightIcon={<MousePointer2 className="w-5 h-5 md:w-6 md:h-6 opacity-60" />}>
              Explore Features
            </Button>
          </MagneticButton>
        </motion.div>

        {/* Bottom Feature Cards with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-16 md:mt-32 max-w-6xl mx-auto px-2"
        >
          {[
            { title: "Lightning Fast", desc: "Process documents in seconds", icon: Zap, color: "text-yellow-500" },
            { title: "AI-Powered", desc: "Smart content understanding", icon: Brain, color: "text-purple-500" },
            { title: "Secure by Design", desc: "Enterprise-grade security", icon: Layers, color: "text-blue-500" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10, rotateX: 5, rotateY: 5 }}
              className="group glass-card p-5 md:p-8 rounded-2xl md:rounded-3xl transition-all duration-500 text-left perspective-500"
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 bg-surface-highlight rounded-xl md:rounded-2xl flex items-center justify-center ${feature.color} mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                <feature.icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-text mb-2 md:mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>)}

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
});

InteractiveHero.displayName = 'InteractiveHero';
