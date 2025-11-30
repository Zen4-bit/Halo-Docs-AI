/**
 * HALO Platform - Tool Options Type Definitions
 * Strict interfaces for all tool options to ensure UI-Logic contract compliance
 * 
 * Architecture: Client-Side First
 * - PDF, Office, Media tools: 100% browser-based (WebAssembly/JavaScript)
 * - AI tools: Server-connected (backend API keys)
 */

// ============================================================================
// PDF TOOL OPTIONS
// ============================================================================

/**
 * PDF Merge Tool Options
 * Ensures files are merged in the specified order
 */
export interface PdfMergeOptions {
  /** Array of File IDs to determine merge order */
  fileOrder: string[];
  /** Create bookmarks for each merged document */
  createBookmarks?: boolean;
  /** Normalize all pages to the same size */
  normalizePageSize?: boolean;
  /** Insert blank separator pages between documents */
  insertSeparators?: boolean;
  /** Add table of contents */
  addTableOfContents?: boolean;
}

/**
 * PDF Split Tool Options
 * Supports range-based and extraction modes
 */
export interface PdfSplitOptions {
  /** Split mode: 'range' for specific pages, 'extract' for selection */
  mode: 'range' | 'extract';
  /** Page ranges in format "1-5, 8, 11-15" */
  ranges: string;
}

/**
 * PDF Compression Options
 * Controls quality and image retention
 */
export interface PdfCompressOptions {
  /** Compression level mapping: low=0.8, medium=0.5, high=0.3 quality */
  compressionLevel: 'low' | 'medium' | 'high';
  /** Whether to retain images in the compressed PDF */
  retainImages: boolean;
}

/**
 * PDF to Image Conversion Options
 */
export interface PdfToImageOptions {
  /** Output image format */
  format: 'png' | 'jpeg';
  /** Image quality (0 to 1, where 1 is highest) */
  quality: number;
}

/**
 * PDF Page Numbering Options
 */
export interface PdfPageNumberOptions {
  /** Position of page numbers */
  position: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-center' | 'top-right';
  /** Font size in points */
  fontSize: number;
  /** Text color in RGB (0-255) */
  color: { r: number; g: number; b: number };
  /** Number format */
  format: '1' | '1 of N' | 'Page 1' | 'Page 1 of N';
  /** Starting page number */
  startFrom: number;
}

/**
 * PDF Watermark Options
 */
export interface PdfWatermarkOptions {
  /** Watermark type */
  type: 'text' | 'image';
  /** Watermark text (if type is 'text') */
  text?: string;
  /** Opacity (0 to 1) */
  opacity: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Font size (for text watermarks) */
  fontSize?: number;
  /** Text color (for text watermarks) */
  color?: { r: number; g: number; b: number };
  /** Watermark position */
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * PDF Rotation Options
 */
export interface PdfRotateOptions {
  /** Rotation angle in degrees */
  angle: 90 | 180 | 270;
  /** Which pages to rotate (empty = all pages) */
  pages?: number[];
}

// ============================================================================
// OFFICE TOOL OPTIONS
// ============================================================================

/**
 * Office to PDF Conversion Options
 * Applies to Word, Excel, PowerPoint conversions
 */
export interface OfficeToPdfOptions {
  /** Whether to include images in the PDF */
  includeImages: boolean;
  /** Maintain original layout (triggers 'best effort' rendering) */
  maintainLayout: boolean;
}

/**
 * Word to PDF Options (extends OfficeToPdfOptions)
 */
export interface WordToPdfOptions extends OfficeToPdfOptions {
  /** Preserve document styles */
  preserveStyles: boolean;
}

/**
 * Excel to PDF Options (extends OfficeToPdfOptions)
 */
export interface ExcelToPdfOptions extends OfficeToPdfOptions {
  /** Which sheets to convert (empty = all sheets) */
  sheets?: string[];
  /** Fit to page width */
  fitToWidth: boolean;
}

// ============================================================================
// MEDIA TOOL OPTIONS
// ============================================================================

/**
 * Image Resize Options
 */
export interface ImageResizeOptions {
  /** Target width in pixels */
  width: number;
  /** Target height in pixels */
  height: number;
  /** Maintain aspect ratio */
  maintainAspect: boolean;
  /** Output format */
  format: 'png' | 'jpeg' | 'webp';
}

/**
 * Image Compression Options
 */
export interface ImageCompressOptions {
  /** Compression quality (0 to 1) */
  quality: number;
  /** Maximum file size in KB (0 = no limit) */
  maxSizeKB?: number;
  /** Output format (preserve original if not specified) */
  format?: 'png' | 'jpeg' | 'webp';
}

/**
 * Image Crop Options
 */
export interface ImageCropOptions {
  /** X coordinate of crop area */
  x: number;
  /** Y coordinate of crop area */
  y: number;
  /** Width of crop area */
  width: number;
  /** Height of crop area */
  height: number;
  /** Output format */
  format: 'png' | 'jpeg' | 'webp';
}

/**
 * Video Conversion Options
 */
export interface VideoConvertOptions {
  /** Target output format */
  targetFormat: 'mp3' | 'mp4' | 'gif';
  /** Quality level */
  quality: 'high' | 'medium' | 'low';
  /** Start time for trimming (in seconds) */
  startTime?: number;
  /** End time for trimming (in seconds) */
  endTime?: number;
}

/**
 * Video to GIF Options
 */
export interface VideoToGifOptions {
  /** Start time (in seconds) */
  startTime: number;
  /** Duration (in seconds, max 10) */
  duration: number;
  /** Output width in pixels */
  width: number;
  /** Frame rate (fps) */
  fps: number;
  /** Quality (0 to 1) */
  quality: number;
}

/**
 * Video Compression Options
 */
export interface VideoCompressOptions {
  /** Compression level */
  compressionLevel: 'low' | 'medium' | 'high';
  /** Target resolution */
  resolution?: '1080p' | '720p' | '480p' | '360p';
  /** Target bitrate in kbps */
  bitrate?: number;
}

// ============================================================================
// AI WORKSPACE OPTIONS (Server-Connected)
// ============================================================================

/**
 * AI Chat Options
 */
export interface AiChatOptions {
  /** Conversation context length */
  contextLength: number;
  /** Response temperature (0 to 1, higher = more creative) */
  temperature: number;
  /** Maximum response tokens */
  maxTokens: number;
}

/**
 * AI Summary Options
 */
export interface AiSummaryOptions {
  /** Maximum summary length in words */
  maxLength: number;
  /** Output format */
  format: 'paragraph' | 'bullets' | 'executive' | 'key-points';
  /** Summary style */
  style: 'concise' | 'detailed' | 'technical';
}

/**
 * AI Translation Options
 */
export interface AiTranslateOptions {
  /** Source language (auto-detect if not specified) */
  sourceLanguage?: string;
  /** Target language */
  targetLanguage: string;
  /** Preserve formatting */
  preserveFormatting: boolean;
  /** Translation style */
  style: 'formal' | 'casual' | 'technical' | 'literary';
}

/**
 * AI Content Improvement Options
 */
export interface AiImproveOptions {
  /** Improvement type */
  type: 'grammar' | 'clarity' | 'tone' | 'all';
  /** Target tone */
  tone: 'professional' | 'casual' | 'academic';
  /** Preserve original meaning */
  preserveMeaning: boolean;
}

/**
 * AI Image Generation Options
 */
export interface AiImageOptions {
  /** AI model to use */
  model: 'dall-e-3' | 'stable-diffusion-xl' | 'midjourney';
  /** Positive prompt describing desired image */
  prompt: string;
  /** Negative prompt (what to avoid) */
  negativePrompt?: string;
  /** Image style */
  style: 'realistic' | 'artistic' | 'anime' | 'photographic' | '3d-render';
  /** Image dimensions */
  dimensions: '1024x1024' | '1024x1792' | '1792x1024';
  /** Quality level */
  quality: 'standard' | 'hd' | 'ultra';
  /** Guidance scale (1-20, how closely to follow prompt) */
  guidanceScale: number;
  /** Seed number for reproducible results */
  seed?: number;
}

/**
 * AI Rewriter Options
 */
export interface AiRewriterOptions {
  /** Tone for rewritten content */
  tone: 'professional' | 'casual' | 'academic' | 'creative' | 'persuasive';
  /** Action to perform */
  action: 'improve' | 'simplify' | 'expand' | 'shorten' | 'paraphrase';
  /** Target length (words) */
  targetLength?: number;
  /** Target audience */
  targetAudience?: string;
  /** Creativity level (1-10) */
  creativityLevel: number;
  /** Preserve original meaning */
  preserveMeaning: boolean;
}

/**
 * AI Data Insights Options
 */
export interface AiInsightsOptions {
  /** Type of analysis to perform */
  analysisType: 'sentiment' | 'keywords' | 'trends' | 'entities' | 'topics' | 'all';
  /** Depth of analysis */
  depth: 'quick' | 'detailed' | 'comprehensive';
  /** Include data visualizations */
  includeVisualizations: boolean;
  /** Export format */
  exportFormat: 'json' | 'csv' | 'pdf';
}

/**
 * Enhanced AI Chat Options
 */
export interface AiChatEnhancedOptions extends AiChatOptions {
  /** AI model selection */
  model: 'gpt-4-turbo' | 'claude-3-opus' | 'gemini-pro';
  /** Custom system prompt */
  systemPrompt?: string;
  /** Enable streaming responses */
  streaming: boolean;
}

/**
 * Enhanced AI Summary Options
 */
export interface AiSummaryEnhancedOptions extends AiSummaryOptions {
  /** Extract keywords */
  extractKeywords: boolean;
  /** Target language for summary */
  targetLanguage?: string;
  /** Include statistical analysis */
  includeStatistics: boolean;
}

/**
 * Enhanced AI Translation Options
 */
export interface AiTranslateEnhancedOptions extends AiTranslateOptions {
  /** Custom glossary for domain-specific terms */
  customGlossary?: Record<string, string>;
  /** Enable context detection */
  contextDetection: boolean;
}

// ============================================================================
// PDF ADVANCED OPTIONS
// ============================================================================

/**
 * PDF to Excel Extraction Options
 */
export interface PdfToExcelOptions {
  /** Auto-detect table boundaries */
  autoDetect: boolean;
  /** Specific table indices to extract (if multiple tables) */
  tableIndices?: number[];
  /** Preserve formatting */
  preserveFormatting: boolean;
  /** Include merged cells */
  includeMergedCells: boolean;
  /** Preserve number formats */
  preserveNumberFormats: boolean;
}

/**
 * Enhanced PDF Compression Options
 */
export interface PdfCompressEnhancedOptions extends PdfCompressOptions {
  /** Convert to grayscale */
  convertToGrayscale?: boolean;
  /** Remove metadata */
  removeMetadata?: boolean;
  /** Show before/after file sizes */
  showSizeComparison?: boolean;
}

/**
 * PDF Split with Thumbnails Options
 */
export interface PdfSplitEnhancedOptions extends PdfSplitOptions {
  /** Show thumbnail previews */
  showThumbnails: boolean;
  /** Thumbnail size in pixels */
  thumbnailSize?: number;
}

/**
 * Enhanced PDF to Image Options
 */
export interface PdfToImageEnhancedOptions extends PdfToImageOptions {
  /** DPI for rendering */
  dpi: 72 | 150 | 300;
  /** Page selection: 'all' or specific page numbers */
  pageSelection: 'all' | number[];
}

// ============================================================================
// MEDIA ADVANCED OPTIONS
// ============================================================================

/**
 * Format-Specific Image Compression Options
 */
export interface FormatSpecificCompressionOptions {
  /** Quality (0-100) */
  quality: number;
  /** Remove metadata */
  removeMetadata?: boolean;
  /** Format-specific options */
  formatOptions?: {
    // JPEG specific
    progressive?: boolean;
    optimizeHuffman?: boolean;
    // PNG specific
    lossless?: boolean;
    reduceColors?: boolean;
    colorPalette?: number;
    // GIF specific
    frameRate?: number;
    optimizePalette?: boolean;
    removeDuplicateFrames?: boolean;
  };
}

/**
 * Advanced Crop Options
 */
export interface AdvancedCropOptions {
  /** Crop mode */
  mode: 'freeform' | 'aspect-ratio';
  /** Aspect ratio preset */
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'custom';
  /** Manual coordinates */
  coordinates?: { x: number; y: number; width: number; height: number };
  /** Zoom level */
  zoom?: number;
  /** For PNG: maintain transparency */
  maintainTransparency?: boolean;
  /** For PNG: trim transparent edges */
  trimTransparent?: boolean;
  /** For JPEG: lossless rotation */
  losslessRotation?: boolean;
  /** Maintain EXIF data */
  maintainExif?: boolean;
}

/**
 * Advanced Image Resize Options
 */
export interface AdvancedResizeOptions extends ImageResizeOptions {
  /** Resize mode */
  mode: 'fit' | 'fill' | 'stretch';
  /** Interpolation quality */
  interpolation: 'nearest' | 'bilinear' | 'bicubic' | 'lanczos';
  /** Sharpen after resize */
  sharpenAfterResize?: boolean;
  /** Anti-aliasing control */
  antiAliasing?: boolean;
}

/**
 * Bulk Resize Options
 */
export interface BulkResizeOptions {
  /** Resize by dimensions or percentage */
  resizeBy: 'dimensions' | 'percentage';
  /** Target dimensions (if resizeBy='dimensions') */
  dimensions?: { width: number; height: number };
  /** Percentage (if resizeBy='percentage') */
  percentage?: number;
  /** Maintain aspect ratio */
  maintainAspect: boolean;
  /** Preview before download */
  showPreview: boolean;
  /** Download as ZIP */
  downloadAsZip: boolean;
}

/**
 * Video Download Options
 */
export interface VideoDownloadOptions {
  /** Video URL */
  url: string;
  /** Platform */
  platform: 'youtube' | 'vimeo' | 'dailymotion';
  /** Quality selection */
  quality: '4k' | '1080p' | '720p' | '480p' | '360p';
  /** Audio only */
  audioOnly: boolean;
  /** Start time for trimming (seconds) */
  startTime?: number;
  /** End time for trimming (seconds) */
  endTime?: number;
}

// ============================================================================
// BATCH PROCESSING OPTIONS
// ============================================================================

/**
 * Batch Processing Options
 * Applies to tools that support batch operations
 */
export interface BatchProcessingOptions {
  /** Maximum concurrent operations */
  maxConcurrent: number;
  /** Continue on individual file errors */
  continueOnError: boolean;
  /** Generate processing report */
  generateReport: boolean;
}

// ============================================================================
// FILE VALIDATION OPTIONS
// ============================================================================

/**
 * File Validation Result
 */
export interface FileValidationResult {
  /** Whether the file is valid */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** File MIME type detected */
  detectedMimeType?: string;
  /** File size in bytes */
  fileSize?: number;
}

/**
 * MIME Type Magic Numbers for validation
 */
export const MIME_MAGIC_NUMBERS: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'image/png': [0x89, 0x50, 0x4E, 0x47], // .PNG
  'image/jpeg': [0xFF, 0xD8, 0xFF], // JPEG
  'image/gif': [0x47, 0x49, 0x46, 0x38], // GIF8
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
  'application/zip': [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP, DOCX, XLSX)
  'video/mp4': [0x00, 0x00, 0x00], // ftyp (MP4)
  'video/webm': [0x1A, 0x45, 0xDF, 0xA3], // WebM
};

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

/**
 * Generic Service Response
 */
export interface ServiceResponse<T = any> {
  /** Whether the operation was successful */
  success: boolean;
  /** Result data (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
  /** Processing time in milliseconds */
  processingTime?: number;
}

/**
 * File Processing Result
 */
export interface FileProcessingResult {
  /** Processed file as Blob or Uint8Array */
  file: Blob | Uint8Array;
  /** Original filename */
  originalFilename: string;
  /** Suggested output filename */
  outputFilename: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType: string;
}

// ============================================================================
// ALL TYPES EXPORTED ABOVE WITH 'export interface' KEYWORD
// ============================================================================
