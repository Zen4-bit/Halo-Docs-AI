// Complete list of all tools for HALO platform

export interface ToolType {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge: string;
  gradient: string;
  href: string;
  category: string;
  endpoint: string;
  acceptedFiles: string;
  multiple: boolean;
  advancedOptions?: Record<string, {
    type: string;
    label: string;
    default: any;
    options?: string[];
    min?: number;
    max?: number;
  }>;
}

export const TOOLS_CONFIG = {
  PDF_TOOLS: [
    {
      id: 'merge-pdf',
      name: 'Merge PDF',
      description: 'Combine multiple PDF files into one document',
      icon: '📑',
      badge: 'PDF',
      gradient: 'from-red-500 to-orange-500',
      href: '/tools/merge-pdf',
      category: 'pdf',
      endpoint: '/api/tools/merge-pdf',
      acceptedFiles: '.pdf',
      multiple: true,
      advancedOptions: {
        removeMetadata: { type: 'boolean', label: 'Remove Metadata', default: false },
        addBookmarks: { type: 'boolean', label: 'Add Bookmarks', default: true }
      }
    },
    {
      id: 'split-pdf',
      name: 'Split PDF',
      description: 'Extract pages from PDF documents',
      icon: '✂️',
      badge: 'PDF',
      gradient: 'from-cyan-500 to-blue-500',
      href: '/tools/split-pdf',
      category: 'pdf',
      endpoint: '/api/tools/split-pdf',
      acceptedFiles: '.pdf',
      multiple: false,
      advancedOptions: {
        splitMode: { type: 'select', label: 'Split Mode', options: ['all', 'range', 'every'], default: 'all' },
        pageRange: { type: 'text', label: 'Page Range (e.g., 1-5,7,9-12)', default: '' },
        everyNPages: { type: 'number', label: 'Every N Pages', default: 1, min: 1 }
      }
    },
    {
      id: 'compress-pdf',
      name: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: '🗜️',
      badge: 'PDF',
      gradient: 'from-green-500 to-teal-500',
      href: '/tools/compress-pdf',
      category: 'pdf',
      endpoint: '/api/tools/compress-pdf',
      acceptedFiles: '.pdf',
      multiple: false,
      advancedOptions: {
        quality: { type: 'select', label: 'Quality', options: ['low', 'medium', 'high', 'max'], default: 'medium' },
        removeMetadata: { type: 'boolean', label: 'Remove Metadata', default: true },
        grayscale: { type: 'boolean', label: 'Convert to Grayscale', default: false }
      }
    },
    {
      id: 'pdf-to-word',
      name: 'PDF to Word',
      description: 'Convert PDF documents to editable Word files',
      icon: '📝',
      badge: 'PDF',
      gradient: 'from-blue-500 to-indigo-500',
      href: '/tools/pdf-to-word',
      category: 'pdf',
      endpoint: '/api/tools/pdf-to-word',
      acceptedFiles: '.pdf',
      multiple: false,
      advancedOptions: {
        pageRange: { type: 'text', label: 'Page Range (optional)', default: '' },
        preserveLayout: { type: 'boolean', label: 'Preserve Layout', default: true }
      }
    },
    {
      id: 'pdf-to-excel',
      name: 'PDF to Excel',
      description: 'Extract tables from PDF to Excel spreadsheets',
      icon: '📊',
      badge: 'PDF',
      gradient: 'from-emerald-500 to-green-500',
      href: '/tools/pdf-to-excel',
      category: 'pdf',
      endpoint: '/api/tools/pdf-to-excel',
      acceptedFiles: '.pdf',
      multiple: false,
      advancedOptions: {
        pageRange: { type: 'text', label: 'Page Range (optional)', default: '' },
        detectTables: { type: 'boolean', label: 'Auto-detect Tables', default: true }
      }
    },
    {
      id: 'pdf-to-image',
      name: 'PDF to Image',
      description: 'Convert PDF pages to image files',
      icon: '🖼️',
      badge: 'PDF',
      gradient: 'from-purple-500 to-violet-500',
      href: '/tools/pdf-to-image',
      category: 'pdf',
      endpoint: '/api/tools/pdf-to-image',
      acceptedFiles: '.pdf',
      multiple: false,
      advancedOptions: {
        outputFormat: { type: 'select', label: 'Image Format', options: ['png', 'jpg', 'webp'], default: 'png' },
        dpi: { type: 'slider', label: 'DPI (Resolution)', min: 72, max: 600, default: 150 },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 90 }
      }
    },
    {
      id: 'repair-pdf',
      name: 'Repair PDF',
      description: 'Fix corrupted or damaged PDF files',
      icon: '🔧',
      badge: 'PDF',
      gradient: 'from-amber-500 to-yellow-500',
      href: '/tools/repair-pdf',
      category: 'pdf',
      endpoint: '/api/tools/repair-pdf',
      acceptedFiles: '.pdf',
      multiple: false
    },
    {
      id: 'add-watermark',
      name: 'Add Watermark',
      description: 'Add text watermarks to PDF files',
      icon: '💧',
      badge: 'PDF',
      gradient: 'from-sky-500 to-blue-500',
      href: '/tools/add-watermark',
      category: 'pdf',
      endpoint: '/api/tools/add-watermark',
      acceptedFiles: '.pdf',
      multiple: false,
      advancedOptions: {
        watermarkText: { type: 'text', label: 'Watermark Text', default: 'CONFIDENTIAL' },
        position: { type: 'select', label: 'Position', options: ['center', 'diagonal', 'header', 'footer'], default: 'center' },
        opacity: { type: 'slider', label: 'Opacity', min: 10, max: 100, default: 30 },
        fontSize: { type: 'slider', label: 'Font Size', min: 12, max: 200, default: 48 },
        color: { type: 'select', label: 'Color', options: ['gray', 'red', 'blue', 'black'], default: 'gray' }
      }
    },
    {
      id: 'add-page-numbers',
      name: 'Add Page Numbers',
      description: 'Add page numbers to PDF documents',
      icon: '🔢',
      badge: 'PDF',
      gradient: 'from-indigo-500 to-purple-500',
      href: '/tools/add-page-numbers',
      category: 'pdf',
      endpoint: '/api/tools/add-page-numbers',
      acceptedFiles: '.pdf',
      multiple: false,
      advancedOptions: {
        position: { type: 'select', label: 'Position', options: ['bottom-center', 'bottom-left', 'bottom-right', 'top-center', 'top-left', 'top-right'], default: 'bottom-center' },
        formatStyle: { type: 'select', label: 'Format', options: ['number', 'page-of-total', 'roman'], default: 'number' },
        startNumber: { type: 'number', label: 'Start Number', default: 1, min: 1 },
        skipFirst: { type: 'boolean', label: 'Skip First Page', default: false }
      }
    },
    {
      id: 'rotate-pdf',
      name: 'Rotate PDF',
      description: 'Rotate PDF pages by any angle',
      icon: '🔄',
      badge: 'PDF',
      gradient: 'from-pink-500 to-rose-500',
      href: '/tools/rotate-pdf',
      category: 'pdf',
      endpoint: '/api/tools/rotate-pdf',
      acceptedFiles: '.pdf',
      multiple: false,
      advancedOptions: {
        rotation: { type: 'select', label: 'Rotation', options: ['90', '180', '270'], default: '90' },
        pages: { type: 'text', label: 'Pages (all, odd, even, or range)', default: 'all' }
      }
    }
  ],

  OFFICE_TOOLS: [
    {
      id: 'word-to-pdf',
      name: 'Word to PDF',
      description: 'Convert Word documents to PDF format',
      icon: '📄',
      badge: 'OFFICE',
      gradient: 'from-blue-600 to-blue-400',
      href: '/tools/word-to-pdf',
      category: 'office',
      endpoint: '/api/tools/word-to-pdf',
      acceptedFiles: '.doc,.docx',
      multiple: false,
      advancedOptions: {
        preserveLayout: { type: 'boolean', label: 'Preserve Layout', default: true },
        embedFonts: { type: 'boolean', label: 'Embed Fonts', default: true },
        compressionLevel: { type: 'select', label: 'Compression', options: ['none', 'low', 'medium', 'high'], default: 'medium' }
      }
    },
    {
      id: 'excel-to-pdf',
      name: 'Excel to PDF',
      description: 'Convert Excel spreadsheets to PDF format',
      icon: '📊',
      badge: 'OFFICE',
      gradient: 'from-green-600 to-green-400',
      href: '/tools/excel-to-pdf',
      category: 'office',
      endpoint: '/api/tools/excel-to-pdf',
      acceptedFiles: '.xls,.xlsx',
      multiple: false,
      advancedOptions: {
        fitToPage: { type: 'boolean', label: 'Fit to Page', default: true },
        orientation: { type: 'select', label: 'Orientation', options: ['portrait', 'landscape'], default: 'portrait' },
        sheetRange: { type: 'text', label: 'Sheet Range (optional)', default: '' }
      }
    },
    {
      id: 'ppt-to-pdf',
      name: 'PPT to PDF',
      description: 'Convert PowerPoint presentations to PDF',
      icon: '📽️',
      badge: 'OFFICE',
      gradient: 'from-orange-600 to-orange-400',
      href: '/tools/ppt-to-pdf',
      category: 'office',
      endpoint: '/api/tools/ppt-to-pdf',
      acceptedFiles: '.ppt,.pptx',
      multiple: false,
      advancedOptions: {
        includeNotes: { type: 'boolean', label: 'Include Speaker Notes', default: false },
        slidesPerPage: { type: 'select', label: 'Slides Per Page', options: ['1', '2', '4', '6'], default: '1' },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 90 }
      }
    }
  ],

  MEDIA_TOOLS: [
    {
      id: 'image-compressor',
      name: 'Image Compressor',
      description: 'Reduce image file size for all formats',
      icon: '🗜️',
      badge: 'MEDIA',
      gradient: 'from-blue-500 to-cyan-500',
      href: '/tools/image-compressor',
      category: 'media',
      endpoint: '/api/tools/image-compressor',
      acceptedFiles: '.jpg,.jpeg,.png,.gif,.webp',
      multiple: false,
      advancedOptions: {
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 80 },
        format: { type: 'select', label: 'Output Format', options: ['original', 'jpg', 'png', 'webp'], default: 'original' },
        keepAspectRatio: { type: 'boolean', label: 'Keep Aspect Ratio', default: true },
        stripMetadata: { type: 'boolean', label: 'Strip Metadata', default: true }
      }
    },
    {
      id: 'video-downloader',
      name: 'Video Downloader',
      description: 'Download videos from YouTube and other platforms',
      icon: '📥',
      badge: 'MEDIA',
      gradient: 'from-green-500 to-emerald-500',
      href: '/tools/video-downloader',
      category: 'media',
      endpoint: '/api/tools/video-downloader',
      acceptedFiles: '',
      multiple: false,
      advancedOptions: {
        resolution: { type: 'select', label: 'Resolution', options: ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'], default: '720p' },
        format: { type: 'select', label: 'Format', options: ['mp4', 'webm', 'mp3'], default: 'mp4' },
        audioOnly: { type: 'boolean', label: 'Audio Only', default: false }
      }
    },
    {
      id: 'png-compressor',
      name: 'PNG Compressor',
      description: 'Optimize PNG images without losing quality',
      icon: '🖼️',
      badge: 'MEDIA',
      gradient: 'from-purple-500 to-pink-500',
      href: '/tools/png-compressor',
      category: 'media',
      endpoint: '/api/tools/png-compressor',
      acceptedFiles: '.png',
      multiple: false,
      advancedOptions: {
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 85 },
        preserveTransparency: { type: 'boolean', label: 'Preserve Transparency', default: true },
        stripMetadata: { type: 'boolean', label: 'Strip Metadata', default: true }
      }
    },
    {
      id: 'jpeg-compressor',
      name: 'JPEG Compressor',
      description: 'Compress JPEG photos efficiently',
      icon: '📸',
      badge: 'MEDIA',
      gradient: 'from-orange-500 to-red-500',
      href: '/tools/jpeg-compressor',
      category: 'media',
      endpoint: '/api/tools/jpeg-compressor',
      acceptedFiles: '.jpg,.jpeg',
      multiple: false,
      advancedOptions: {
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 80 },
        progressive: { type: 'boolean', label: 'Progressive JPEG', default: true },
        stripMetadata: { type: 'boolean', label: 'Strip Metadata', default: true }
      }
    },
    {
      id: 'gif-compressor',
      name: 'GIF Compressor',
      description: 'Reduce GIF animation file size',
      icon: '🎞️',
      badge: 'MEDIA',
      gradient: 'from-pink-500 to-rose-500',
      href: '/tools/gif-compressor',
      category: 'media',
      endpoint: '/api/tools/gif-compressor',
      acceptedFiles: '.gif',
      multiple: false,
      advancedOptions: {
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 80 },
        colors: { type: 'slider', label: 'Color Count', min: 2, max: 256, default: 256 },
        lossyCompression: { type: 'slider', label: 'Lossy Level', min: 0, max: 200, default: 80 }
      }
    },
    {
      id: 'webp-compressor',
      name: 'WebP Compressor',
      description: 'Compress WebP images efficiently',
      icon: '🌐',
      badge: 'MEDIA',
      gradient: 'from-emerald-500 to-teal-500',
      href: '/tools/webp-compressor',
      category: 'media',
      endpoint: '/api/tools/webp-compressor',
      acceptedFiles: '.webp',
      multiple: false,
      advancedOptions: {
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 85 },
        lossless: { type: 'boolean', label: 'Lossless Compression', default: false },
        stripMetadata: { type: 'boolean', label: 'Strip Metadata', default: true }
      }
    },
    {
      id: 'crop-image',
      name: 'Crop Image',
      description: 'Crop images to custom dimensions',
      icon: '✂️',
      badge: 'MEDIA',
      gradient: 'from-cyan-500 to-blue-500',
      href: '/tools/crop-image',
      category: 'media',
      endpoint: '/api/tools/crop-image',
      acceptedFiles: '.jpg,.jpeg,.png,.webp',
      multiple: false,
      advancedOptions: {
        aspectRatio: { type: 'select', label: 'Aspect Ratio', options: ['free', '1:1', '4:3', '16:9', '3:2'], default: 'free' },
        outputFormat: { type: 'select', label: 'Output Format', options: ['original', 'jpg', 'png', 'webp'], default: 'original' },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 90 }
      }
    },
    {
      id: 'crop-png',
      name: 'Crop PNG',
      description: 'Crop PNG images with transparency support',
      icon: '🔲',
      badge: 'MEDIA',
      gradient: 'from-indigo-500 to-purple-500',
      href: '/tools/crop-png',
      category: 'media',
      endpoint: '/api/tools/crop-png',
      acceptedFiles: '.png',
      multiple: false,
      advancedOptions: {
        aspectRatio: { type: 'select', label: 'Aspect Ratio', options: ['free', '1:1', '4:3', '16:9', '3:2'], default: 'free' },
        preserveTransparency: { type: 'boolean', label: 'Preserve Transparency', default: true },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 90 }
      }
    },
    {
      id: 'crop-webp',
      name: 'Crop WebP',
      description: 'Crop modern WebP format images',
      icon: '🌐',
      badge: 'MEDIA',
      gradient: 'from-teal-500 to-cyan-500',
      href: '/tools/crop-webp',
      category: 'media',
      endpoint: '/api/tools/crop-webp',
      acceptedFiles: '.webp',
      multiple: false,
      advancedOptions: {
        aspectRatio: { type: 'select', label: 'Aspect Ratio', options: ['free', '1:1', '4:3', '16:9', '3:2'], default: 'free' },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 90 }
      }
    },
    {
      id: 'crop-jpg',
      name: 'Crop JPG',
      description: 'Crop JPEG images precisely',
      icon: '📐',
      badge: 'MEDIA',
      gradient: 'from-amber-500 to-orange-500',
      href: '/tools/crop-jpg',
      category: 'media',
      endpoint: '/api/tools/crop-jpg',
      acceptedFiles: '.jpg,.jpeg',
      multiple: false,
      advancedOptions: {
        aspectRatio: { type: 'select', label: 'Aspect Ratio', options: ['free', '1:1', '4:3', '16:9', '3:2'], default: 'free' },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 85 }
      }
    },
    {
      id: 'image-resizer',
      name: 'Image Resizer',
      description: 'Resize images to any dimension',
      icon: '📏',
      badge: 'MEDIA',
      gradient: 'from-violet-500 to-purple-500',
      href: '/tools/image-resizer',
      category: 'media',
      endpoint: '/api/tools/image-resizer',
      acceptedFiles: '.jpg,.jpeg,.png,.webp',
      multiple: false,
      advancedOptions: {
        width: { type: 'number', label: 'Width (px)', default: 800, min: 1 },
        height: { type: 'number', label: 'Height (px)', default: 600, min: 1 },
        keepAspectRatio: { type: 'boolean', label: 'Keep Aspect Ratio', default: true },
        outputFormat: { type: 'select', label: 'Output Format', options: ['original', 'jpg', 'png', 'webp'], default: 'original' },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 90 }
      }
    },
    {
      id: 'resize-png',
      name: 'Resize PNG',
      description: 'Resize PNG images with transparency',
      icon: '🔷',
      badge: 'MEDIA',
      gradient: 'from-blue-600 to-blue-400',
      href: '/tools/resize-png',
      category: 'media',
      endpoint: '/api/tools/resize-png',
      acceptedFiles: '.png',
      multiple: false,
      advancedOptions: {
        width: { type: 'number', label: 'Width (px)', default: 800, min: 1 },
        height: { type: 'number', label: 'Height (px)', default: 600, min: 1 },
        keepAspectRatio: { type: 'boolean', label: 'Keep Aspect Ratio', default: true },
        preserveTransparency: { type: 'boolean', label: 'Preserve Transparency', default: true },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 90 }
      }
    },
    {
      id: 'resize-jpg',
      name: 'Resize JPG',
      description: 'Resize JPEG images efficiently',
      icon: '🔶',
      badge: 'MEDIA',
      gradient: 'from-orange-600 to-yellow-400',
      href: '/tools/resize-jpg',
      category: 'media',
      endpoint: '/api/tools/resize-jpg',
      acceptedFiles: '.jpg,.jpeg',
      multiple: false,
      advancedOptions: {
        width: { type: 'number', label: 'Width (px)', default: 800, min: 1 },
        height: { type: 'number', label: 'Height (px)', default: 600, min: 1 },
        keepAspectRatio: { type: 'boolean', label: 'Keep Aspect Ratio', default: true },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 85 }
      }
    },
    {
      id: 'resize-webp',
      name: 'Resize WebP',
      description: 'Resize WebP images to custom size',
      icon: '🔷',
      badge: 'MEDIA',
      gradient: 'from-cyan-600 to-teal-400',
      href: '/tools/resize-webp',
      category: 'media',
      endpoint: '/api/tools/resize-webp',
      acceptedFiles: '.webp',
      multiple: false,
      advancedOptions: {
        width: { type: 'number', label: 'Width (px)', default: 800, min: 1 },
        height: { type: 'number', label: 'Height (px)', default: 600, min: 1 },
        keepAspectRatio: { type: 'boolean', label: 'Keep Aspect Ratio', default: true },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 90 }
      }
    },
    {
      id: 'bulk-resize',
      name: 'Bulk Resize',
      description: 'Resize multiple images at once',
      icon: '📦',
      badge: 'MEDIA',
      gradient: 'from-emerald-600 to-green-400',
      href: '/tools/bulk-resize',
      category: 'media',
      endpoint: '/api/tools/bulk-resize',
      acceptedFiles: '.jpg,.jpeg,.png,.webp',
      multiple: true,
      advancedOptions: {
        width: { type: 'number', label: 'Width (px)', default: 800, min: 1 },
        height: { type: 'number', label: 'Height (px)', default: 600, min: 1 },
        keepAspectRatio: { type: 'boolean', label: 'Keep Aspect Ratio', default: true },
        outputFormat: { type: 'select', label: 'Output Format', options: ['original', 'jpg', 'png', 'webp'], default: 'original' },
        quality: { type: 'slider', label: 'Quality', min: 1, max: 100, default: 90 }
      }
    }
  ]
};

// Flatten all tools into a single array
export const ALL_TOOLS: ToolType[] = [
  ...TOOLS_CONFIG.PDF_TOOLS,
  ...TOOLS_CONFIG.OFFICE_TOOLS,
  ...TOOLS_CONFIG.MEDIA_TOOLS
];

// Get tool by ID
export const getToolById = (id: string): ToolType | undefined => {
  return ALL_TOOLS.find(tool => tool.id === id);
};

// Get tools by category
export const getToolsByCategory = (category: string): ToolType[] => {
  switch(category) {
    case 'pdf':
      return TOOLS_CONFIG.PDF_TOOLS;
    case 'office':
      return TOOLS_CONFIG.OFFICE_TOOLS;
    case 'media':
      return TOOLS_CONFIG.MEDIA_TOOLS;
    default:
      return [];
  }
};
