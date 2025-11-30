/**
 * HALO Platform - PDF Service
 * 100% Client-Side PDF Processing using pdf-lib & pdfjs-dist
 * 
 * Architecture: No server calls, all processing in browser
 * Libraries: pdf-lib (manipulation), pdfjs-dist (rendering)
 */

import { PDFDocument, PDFPage, rgb, StandardFonts, degrees, PDFImage } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
import type {
  PdfMergeOptions,
  PdfSplitOptions,
  PdfCompressOptions,
  PdfToImageOptions,
  PdfPageNumberOptions,
  PdfWatermarkOptions,
  PdfRotateOptions,
  ServiceResponse,
  FileProcessingResult,
} from '@/types/tool-options';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * PdfService - Client-side PDF processing
 */
export class PdfService {
  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Read PDF file as Uint8Array
   */
  private static async readPDFFile(file: File): Promise<Uint8Array> {
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Parse page ranges from string format "1-3, 5, 7-9"
   */
  private static parsePageRanges(rangesStr: string, totalPages: number): number[] {
    const pages: Set<number> = new Set();
    const ranges = rangesStr.split(',').map(r => r.trim());

    for (const range of ranges) {
      if (range.includes('-')) {
        const parts = range.split('-').map(n => parseInt(n.trim()));
        const start = parts[0];
        const end = parts[1];
        if (start !== undefined && end !== undefined && !isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = Math.max(1, start); i <= Math.min(end, totalPages); i++) {
            pages.add(i - 1); // Convert to 0-indexed
          }
        }
      } else {
        const pageNum = parseInt(range);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          pages.add(pageNum - 1); // Convert to 0-indexed
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }

  /**
   * Get compression quality based on level
   */
  private static getCompressionQuality(level: 'low' | 'medium' | 'high'): number {
    const qualityMap = {
      low: 0.8,
      medium: 0.5,
      high: 0.3,
    };
    return qualityMap[level];
  }

  /**
   * Create result object
   */
  private static createResult(
    pdfBytes: Uint8Array,
    originalFilename: string,
    suffix: string = 'processed'
  ): FileProcessingResult {
    const nameWithoutExt = originalFilename.replace(/\.pdf$/i, '');
    return {
      file: pdfBytes,
      originalFilename,
      outputFilename: `${nameWithoutExt}-${suffix}.pdf`,
      fileSize: pdfBytes.length,
      mimeType: 'application/pdf',
    };
  }

  // ============================================================================
  // PDF MERGE
  // ============================================================================

  /**
   * Merge multiple PDF files in specified order
   * @param files - Array of PDF files
   * @param options - Merge options with file order
   */
  static async mergeFiles(
    files: File[],
    options: PdfMergeOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      if (files.length < 2) {
        throw new Error('At least 2 PDF files are required for merging');
      }

      // Create a map of file IDs to files
      const fileMap = new Map<string, File>();
      files.forEach(file => {
        const fileId = file.name; // Use filename as ID
        fileMap.set(fileId, file);
      });

      // Order files according to options.fileOrder
      const orderedFiles: File[] = [];
      for (const fileId of options.fileOrder) {
        const file = fileMap.get(fileId);
        if (file) {
          orderedFiles.push(file);
        }
      }

      // Add any remaining files not in fileOrder
      files.forEach(file => {
        if (!orderedFiles.includes(file)) {
          orderedFiles.push(file);
        }
      });

      // Create merged PDF
      const mergedPdf = await PDFDocument.create();

      for (const file of orderedFiles) {
        const pdfBytes = await this.readPDFFile(file);
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      const resultBytes = await mergedPdf.save();
      const result = this.createResult(resultBytes, 'merged-document', 'merged');

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to merge PDF files',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // PDF SPLIT
  // ============================================================================

  /**
   * Split PDF by page ranges
   * @param file - PDF file to split
   * @param options - Split options with mode and ranges
   */
  static async splitFile(
    file: File,
    options: PdfSplitOptions
  ): Promise<ServiceResponse<FileProcessingResult[]>> {
    const startTime = Date.now();

    try {
      const pdfBytes = await this.readPDFFile(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const totalPages = pdf.getPageCount();

      if (totalPages === 0) {
        throw new Error('PDF has no pages');
      }

      const pageIndices = this.parsePageRanges(options.ranges, totalPages);

      if (pageIndices.length === 0) {
        throw new Error('No valid page ranges specified');
      }

      const results: FileProcessingResult[] = [];

      if (options.mode === 'extract') {
        // Extract specified pages into a single PDF
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(pdf, pageIndices);
        pages.forEach(page => newPdf.addPage(page));

        const resultBytes = await newPdf.save();
        results.push(this.createResult(resultBytes, file.name, 'extracted'));
      } else {
        // Split into individual PDFs for each page
        for (let i = 0; i < pageIndices.length; i++) {
          const pageIndex = pageIndices[i];
          if (pageIndex === undefined) continue;

          const newPdf = await PDFDocument.create();
          const pages = await newPdf.copyPages(pdf, [pageIndex]);
          const page = pages[0];
          if (!page) continue;

          newPdf.addPage(page);
          const resultBytes = await newPdf.save();
          results.push(this.createResult(resultBytes, file.name, `page-${pageIndex + 1}`));
        }
      }

      return {
        success: true,
        data: results,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to split PDF',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // PDF COMPRESS
  // ============================================================================

  /**
   * Compress PDF by reducing image quality
   * @param file - PDF file to compress
   * @param options - Compression options
   */
  static async compressFile(
    file: File,
    options: PdfCompressOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      const pdfBytes = await this.readPDFFile(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const quality = this.getCompressionQuality(options.compressionLevel);

      // If retainImages is false, we need to remove or compress images
      if (!options.retainImages) {
        // For now, we'll compress by re-saving with optimizations
        // More advanced image compression would require canvas manipulation
        const compressedBytes = await pdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
        });

        const result = this.createResult(compressedBytes, file.name, 'compressed');

        return {
          success: true,
          data: result,
          processingTime: Date.now() - startTime,
        };
      } else {
        // Save with compression
        const compressedBytes = await pdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
        });

        const result = this.createResult(compressedBytes, file.name, 'compressed');

        return {
          success: true,
          data: result,
          processingTime: Date.now() - startTime,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to compress PDF',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // PDF TO IMAGE
  // ============================================================================

  /**
   * Convert PDF pages to images
   * @param file - PDF file to convert
   * @param options - Conversion options
   */
  static async convertToImages(
    file: File,
    options: PdfToImageOptions
  ): Promise<ServiceResponse<Blob[]>> {
    const startTime = Date.now();

    try {
      const pdfBytes = await this.readPDFFile(file);
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdfDoc = await loadingTask.promise;

      const images: Blob[] = [];

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better quality

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            `image/${options.format}`,
            options.quality
          );
        });

        images.push(blob);
      }

      return {
        success: true,
        data: images,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to convert PDF to images',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // PDF PAGE NUMBERS
  // ============================================================================

  /**
   * Add page numbers to PDF
   * @param file - PDF file
   * @param options - Page numbering options
   */
  static async addPageNumbers(
    file: File,
    options: PdfPageNumberOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      const pdfBytes = await this.readPDFFile(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      const totalPages = pages.length;

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNumber = options.startFrom + index;

        // Format text based on options
        let text: string;
        switch (options.format) {
          case '1':
            text = pageNumber.toString();
            break;
          case '1 of N':
            text = `${pageNumber} of ${totalPages}`;
            break;
          case 'Page 1':
            text = `Page ${pageNumber}`;
            break;
          case 'Page 1 of N':
            text = `Page ${pageNumber} of ${totalPages}`;
            break;
        }

        const textWidth = font.widthOfTextAtSize(text, options.fontSize);
        let x: number;
        let y: number;
        const margin = 20;

        // Position based on options
        switch (options.position) {
          case 'bottom-left':
            x = margin;
            y = margin;
            break;
          case 'bottom-center':
            x = (width - textWidth) / 2;
            y = margin;
            break;
          case 'bottom-right':
            x = width - textWidth - margin;
            y = margin;
            break;
          case 'top-left':
            x = margin;
            y = height - options.fontSize - margin;
            break;
          case 'top-center':
            x = (width - textWidth) / 2;
            y = height - options.fontSize - margin;
            break;
          case 'top-right':
            x = width - textWidth - margin;
            y = height - options.fontSize - margin;
            break;
        }

        page.drawText(text, {
          x,
          y,
          size: options.fontSize,
          font,
          color: rgb(
            options.color.r / 255,
            options.color.g / 255,
            options.color.b / 255
          ),
        });
      });

      const resultBytes = await pdf.save();
      const result = this.createResult(resultBytes, file.name, 'numbered');

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add page numbers',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // PDF WATERMARK
  // ============================================================================

  /**
   * Add watermark to PDF
   * @param file - PDF file
   * @param options - Watermark options
   */
  static async addWatermark(
    file: File,
    options: PdfWatermarkOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      const pdfBytes = await this.readPDFFile(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();

      if (options.type === 'text' && options.text) {
        const font = await pdf.embedFont(StandardFonts.HelveticaBold);

        pages.forEach((page, idx) => {
          if (!page) return;
          const { width, height } = page.getSize();
          let x: number;
          let y: number;

          switch (options.position) {
            case 'center':
              x = width / 2;
              y = height / 2;
              break;
            case 'top-left':
              x = width * 0.2;
              y = height * 0.8;
              break;
            case 'top-right':
              x = width * 0.8;
              y = height * 0.8;
              break;
            case 'bottom-left':
              x = width * 0.2;
              y = height * 0.2;
              break;
            case 'bottom-right':
              x = width * 0.8;
              y = height * 0.2;
              break;
          }

          if (!options.text) return;

          page.drawText(options.text, {
            x,
            y,
            size: options.fontSize || 48,
            font,
            color: rgb(
              (options.color?.r || 128) / 255,
              (options.color?.g || 128) / 255,
              (options.color?.b || 128) / 255
            ),
            opacity: options.opacity,
            rotate: degrees(options.rotation),
          });
        });
      }

      const resultBytes = await pdf.save();
      const result = this.createResult(resultBytes, file.name, 'watermarked');

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add watermark',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // PDF ROTATE
  // ============================================================================

  /**
   * Rotate PDF pages
   * @param file - PDF file
   * @param options - Rotation options
   */
  static async rotatePages(
    file: File,
    options: PdfRotateOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      const pdfBytes = await this.readPDFFile(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();

      // Determine which pages to rotate
      const pagesToRotate = options.pages && options.pages.length > 0
        ? options.pages
        : Array.from({ length: pages.length }, (_, i) => i + 1);

      pagesToRotate.forEach(pageNum => {
        const index = pageNum - 1; // Convert to 0-indexed
        if (index >= 0 && index < pages.length) {
          const page = pages[index];
          if (page) {
            const currentRotation = page.getRotation().angle;
            const newRotation = (currentRotation + options.angle) % 360;
            page.setRotation(degrees(newRotation));
          }
        }
      });

      const resultBytes = await pdf.save();
      const result = this.createResult(resultBytes, file.name, 'rotated');

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to rotate PDF',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get PDF metadata
   */
  static async getMetadata(file: File): Promise<{
    pageCount: number;
    fileSize: number;
    title?: string;
    author?: string;
  }> {
    const pdfBytes = await this.readPDFFile(file);
    const pdf = await PDFDocument.load(pdfBytes);

    const title = pdf.getTitle();
    const author = pdf.getAuthor();

    return {
      pageCount: pdf.getPageCount(),
      fileSize: file.size,
      ...(title && { title }),
      ...(author && { author }),
    };
  }

  /**
   * Download processed file
   */
  static downloadFile(result: FileProcessingResult): void {
    const blob = result.file instanceof Blob
      ? result.file
      : new Blob([result.file as BlobPart], { type: result.mimeType });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.outputFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Download multiple files as ZIP
   */
  static async downloadMultipleFiles(results: FileProcessingResult[]): Promise<void> {
    // For now, download each file individually
    // TODO: Implement ZIP creation using JSZip
    for (const result of results) {
      this.downloadFile(result);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
