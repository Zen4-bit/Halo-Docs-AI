'use client';

import { AboutHero } from '@/components/about/AboutHero';
import { MissionVision } from '@/components/about/MissionVision';
import { ValuesSection } from '@/components/about/ValuesSection';
import { TeamGrid } from '@/components/about/TeamGrid';
import FinalCTA from '@/components/home/FinalCTA';
import Footer from '@/components/Footer';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-[#0b0f1c] text-white selection:bg-purple-500/30">
            <AboutHero />
            <MissionVision />
            <ValuesSection />
            <TeamGrid />
            <FinalCTA />
            <Footer />
        </main>
    );
}
