import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { CommandPalette } from '@/components/CommandPalette';
import { Global3DBackground, Global3DContent } from '@/components/Global3DLayout';
import SmoothScroll from '@/components/SmoothScroll';
import { Navigation } from '@/components/Navigation';
import { MainContent } from '@/components/MainContent';
import { ActiveFileProvider } from '@/context/ActiveFileContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HALO AI - Next-Gen Document Intelligence',
  description: 'AI-powered document processing platform with advanced automation and collaboration features',
  keywords: ['AI', 'PDF', 'documents', 'automation', 'Halo-AI', 'document intelligence'],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <SmoothScroll>
          <Providers>
            <ActiveFileProvider>
              <div className="relative flex min-h-screen flex-col overflow-hidden">
                <Global3DBackground />
                <CommandPalette />
                <a
                  href="#main-content"
                  className="absolute left-[-999px] top-4 z-[5000] rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white focus:left-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                >
                  Skip to main content
                </a>

                <Navigation />

                <Global3DContent>
                  <MainContent>{children}</MainContent>
                </Global3DContent>
              </div>
            </ActiveFileProvider>
          </Providers>
        </SmoothScroll>
      </body>
    </html>
  );
}
