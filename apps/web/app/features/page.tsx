'use client';

import { InteractiveFeatureHero } from '@/components/features/InteractiveFeatureHero';
import { FeatureShowcase } from '@/components/features/FeatureShowcase';
import FeaturesSection from '@/components/home/FeaturesSection';
import FinalCTA from '@/components/home/FinalCTA';
import Footer from '@/components/Footer';

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1c] text-white selection:bg-purple-500/30">
      <InteractiveFeatureHero />
      <FeatureShowcase />

      <div className="relative z-10 bg-gradient-to-b from-[#0b0f1c] to-slate-900">
        <div className="py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Explore the Full <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Catalog</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto px-4">
            Beyond our core features, discover a complete suite of tools designed for every document need.
          </p>
        </div>
        <FeaturesSection />
      </div>

      <FinalCTA />
      <Footer />
    </main>
  );
}
