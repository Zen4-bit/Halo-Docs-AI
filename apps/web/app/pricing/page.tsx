'use client';

import { PricingHero } from '@/components/pricing/PricingHero';
import { PricingTiers } from '@/components/pricing/PricingTiers';
import { PricingComparison } from '@/components/pricing/PricingComparison';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import FinalCTA from '@/components/home/FinalCTA';
import Footer from '@/components/Footer';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1c] text-white selection:bg-purple-500/30">
      <PricingHero />
      <PricingTiers />
      <PricingComparison />
      <PricingFAQ />

      <FinalCTA />
      <Footer />
    </main>
  );
}
