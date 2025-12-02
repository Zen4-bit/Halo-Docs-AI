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
    </div>
  );
}
