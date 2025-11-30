'use client';

import { ContactHero } from '@/components/contact/ContactHero';
import { ContactForm } from '@/components/contact/ContactForm';
import FinalCTA from '@/components/home/FinalCTA';
import Footer from '@/components/Footer';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1c] text-white selection:bg-purple-500/30">
      <ContactHero />
      <ContactForm />
      <FinalCTA />
      <Footer />
    </main>
  );
}
