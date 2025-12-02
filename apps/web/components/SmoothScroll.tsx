'use client';

import { usePathname } from 'next/navigation';
import { ReactLenis } from '@studio-freight/react-lenis';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Disable Lenis smooth scroll inside AI Workspace tools to allow native scrolling
    const isAIWorkspaceTool = pathname.startsWith('/ai-workspace/') && pathname !== '/ai-workspace';
    
    // Disable Lenis smooth scroll on utility tool pages for native panel scrolling
    const isUtilityToolPage = pathname.startsWith('/tools/') && pathname !== '/tools';
    
    // If inside AI tool or utility tool, render children directly without Lenis wrapper
    if (isAIWorkspaceTool || isUtilityToolPage) {
        return <>{children}</>;
    }

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
