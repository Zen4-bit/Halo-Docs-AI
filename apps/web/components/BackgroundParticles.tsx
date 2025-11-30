'use client';

import React, { useEffect, useRef } from 'react';
import { unifiedRaf } from '@/lib/unified-raf';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
}

export default function BackgroundParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let width = window.innerWidth;
        let height = window.innerHeight;

        const initParticles = () => {
            particles = [];
            const particleCount = Math.min(15, Math.floor((width * height) / 25000)); // Reduced count for performance

            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.2, // Slow movement
                    vy: (Math.random() - 0.5) * 0.2,
                    size: Math.random() * 2 + 1,
                    alpha: Math.random() * 0.3 + 0.1,
                });
            }
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initParticles();
        };

        const animate = (time: number) => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.5})`; // White particles, low opacity
                ctx.fill();
            });
        };

        window.addEventListener('resize', resize);
        resize();

        // Use unifiedRaf for synchronized animation loop
        const unsubscribe = unifiedRaf.subscribe(animate);

        return () => {
            window.removeEventListener('resize', resize);
            unsubscribe();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none opacity-50"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
