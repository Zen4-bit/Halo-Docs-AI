'use client';
import React, { memo } from 'react';
import BackgroundParticles from './BackgroundParticles';

// --- Background Component ---
export const Global3DBackground: React.FC = memo(() => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
            {/* Grid Pattern - Static */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.07]" />

            {/* Dynamic Particles */}
            <BackgroundParticles />

            {/* Static Gradient Orbs - No Animation */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-secondary/5 rounded-full blur-3xl" />
        </div>
    );
});

Global3DBackground.displayName = 'Global3DBackground';

// --- Content Wrapper Component ---
export const Global3DContent: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
    return (
        <div className="relative z-10 min-h-screen flex flex-col">
            {children}
        </div>
    );
});

Global3DContent.displayName = 'Global3DContent';
