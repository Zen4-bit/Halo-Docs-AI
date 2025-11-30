import { PDFDocument, PDFPage, rgb, StandardFonts, degrees } from 'pdf-lib';

export interface PDFOptions {
  quality?: 'low' | 'medium' | 'high';
  compression?: boolean;
  password?: string;
}

export class PDFProcessor {
  static async readPDFFile(file: File): Promise<Uint8Array> {
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
  }

  static async createDownloadablePDF(pdfBytes: Uint8Array, filename: string): Promise<Response> {
    const blob = new Blob([Buffer.from(pdfBytes)], { type: 'application/pdf' });
    return new Response(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  }

  static async mergePDFs(pdfFiles: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const file of pdfFiles) {
      const pdfBytes = await this.readPDFFile(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }

  static async splitPDF(pdfFile: File, pageRanges: number[][]): Promise<Uint8Array[]> {
    const pdfBytes = await this.readPDFFile(pdfFile);
    const pdf = await PDFDocument.load(pdfBytes);
    const results: Uint8Array[] = [];

    for (const range of pageRanges) {
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, range);
      pages.forEach((page) => newPdf.addPage(page));
      results.push(await newPdf.save());
    }

    return results;
  }

  static async rotatePDF(pdfFile: File, angle: 90 | 180 | 270): Promise<Uint8Array> {
    const pdfBytes = await this.readPDFFile(pdfFile);
    const pdf = await PDFDocument.load(pdfBytes);

    const pages = pdf.getPages();
    pages.forEach((page) => {
      page.setRotation(degrees(angle));
    });

    return await pdf.save();
  }

  static async addPageNumbers(
    pdfFile: File,
    options: {
      position: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-center' | 'top-right';
      fontSize: number;
      color: { r: number; g: number; b: number };
      format: '1' | '1 of N' | 'Page 1' | 'Page 1 of N';
      startFrom: number;
    }
  ): Promise<Uint8Array> {
    const pdfBytes = await this.readPDFFile(pdfFile);
    const pdf = await PDFDocument.load(pdfBytes);

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    const totalPages = pages.length;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const pageNumber = options.startFrom + index;

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
        color: rgb(options.color.r / 255, options.color.g / 255, options.color.b / 255),
      });
    });

    return await pdf.save();
  }

  static async addWatermark(
    pdfFile: File,
    options: {
      type: 'text' | 'image';
      text?: string;
      imageData?: Uint8Array;
      opacity: number;
      rotation: number;
      fontSize?: number;
      color?: { r: number; g: number; b: number };
      position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    }
  ): Promise<Uint8Array> {
    const pdfBytes = await this.readPDFFile(pdfFile);
    const pdf = await PDFDocument.load(pdfBytes);

    const pages = pdf.getPages();

    if (options.type === 'text' && options.text) {
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);

      pages.forEach((page) => {
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

        page.drawText(options.text ?? '', {
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

    return await pdf.save();
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'File must be a PDF' };
  }

  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    return { isValid: false, error: 'File size must be less than 50MB' };
  }

  return { isValid: true };
}
