import ToolsCatalog from '@/components/ToolsCatalog';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HALO Tools - Free Online PDF, Office & Media Tools',
  description: '28+ powerful free tools for PDF, Office documents, images and videos. Merge, split, compress, convert, repair, watermark and optimize your files with professional quality.',
  keywords: 'PDF tools, image compressor, video downloader, file converter, merge PDF, split PDF, compress PDF, repair PDF, watermark PDF, rotate PDF',
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen selection:bg-brand-500/30">
      <div className="container mx-auto px-4 py-24">
        <ToolsCatalog
          heading="Professional Grade Tools"
          subheading="A complete suite of 28+ professional-grade tools for PDF, Office documents, images, and videos. Free, secure, and running entirely in your browser."
        />
      </div>

      {/* Features Section */}
      <section className="py-24 bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Why Choose HALO Tools?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              We provide professional-grade tools completely free, with a focus on privacy and performance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/5 rounded-3xl transform group-hover:scale-105 transition-transform duration-300" />
              <div className="relative p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text mb-3">100% Secure</h3>
                <p className="text-text-secondary leading-relaxed">
                  All files are processed locally in your browser using advanced WebAssembly technology. Your data never leaves your device.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-green-500/5 rounded-3xl transform group-hover:scale-105 transition-transform duration-300" />
              <div className="relative p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text mb-3">Lightning Fast</h3>
                <p className="text-text-secondary leading-relaxed">
                  Optimized algorithms ensure instant processing even for large files. No queues, no waiting time.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-purple-500/5 rounded-3xl transform group-hover:scale-105 transition-transform duration-300" />
              <div className="relative p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text mb-3">Always Free</h3>
                <p className="text-text-secondary leading-relaxed">
                  No registration, no watermarks, no premium paywalls. Access all features completely free, forever.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
