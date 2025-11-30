import type { Metadata } from 'next';
import { InteractiveHero } from '@/components/InteractiveHero';
import { SmoothStory } from '@/components/SmoothStory';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorks from '@/components/home/HowItWorks';

import FinalCTA from '@/components/home/FinalCTA';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'HALO AI - Next-Gen Document Intelligence Platform',
  description: 'Transform how you work with documents using AI-powered automation and intelligent workflows.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen selection:bg-primary/30">
      <InteractiveHero />

      <div className="relative z-10">
        <SmoothStory />



        <FeaturesSection />
        <HowItWorks />

        <FinalCTA />
        <Footer />
      </div>
    </main>
  );
}
