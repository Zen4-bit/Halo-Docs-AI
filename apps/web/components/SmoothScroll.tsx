'use client';

import { ReactLenis } from '@studio-freight/react-lenis';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    const lenisOptions = {
        lerp: 0.15,
        duration: 0.8,
        smoothTouch: false,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
    };

    return (
        <ReactLenis root options={lenisOptions}>
            {children as any}
        </ReactLenis>
    );
}
