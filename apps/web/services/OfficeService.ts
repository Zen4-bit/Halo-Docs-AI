/**
 * HALO Platform - Office Document Service
 * 100% Client-Side Office to PDF Conversion
 * 
 * Architecture: No server calls, all processing in browser
 * Libraries: mammoth.js (Word), SheetJS (Excel), html2pdf.js (conversion)
 */

// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import * as XLSX from 'xlsx';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
// @ts-ignore
import html2canvas from 'html2canvas';
import type {
  WordToPdfOptions,
  ExcelToPdfOptions,
  ServiceResponse,
  FileProcessingResult,
} from '@/types/tool-options';

/**
 * OfficeService - Client-side Office document processing
 */
export class OfficeService {
  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Read file as ArrayBuffer
   */
  private static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return await file.arrayBuffer();
  }

  /**
   * Create result object
   */
  private static createResult(
    pdfBytes: Uint8Array | Blob,
    originalFilename: string
  ): FileProcessingResult {
    const nameWithoutExt = originalFilename.replace(/\.(docx?|xlsx?|pptx?)$/i, '');
    const blob = pdfBytes instanceof Blob ? pdfBytes : new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });

    return {
      file: blob,
      originalFilename,
      outputFilename: `${nameWithoutExt}.pdf`,
      fileSize: blob.size,
      mimeType: 'application/pdf',
    };
  }

  /**
   * Apply custom CSS for Word document layout
   */
  private static getWordLayoutCSS(maintainLayout: boolean): string {
    return maintainLayout ? `
      body {
        font-family: 'Calibri', 'Arial', sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        margin: 0;
        padding: 40px;
        max-width: 816px; /* A4 width in pixels at 96 DPI */
      }
      p {
        margin: 0 0 10pt 0;
      }
      h1, h2, h3, h4, h5, h6 {
        margin: 10pt 0;
        font-weight: bold;
      }
      h1 { font-size: 18pt; }
      h2 { font-size: 16pt; }
      h3 { font-size: 14pt; }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 10pt 0;
      }
      td, th {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      ul, ol {
        margin: 10pt 0;
        padding-left: 30pt;
      }
    ` : `
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
      }
    `;
  }

  // ============================================================================
  // WORD TO PDF
  // ============================================================================

  /**
   * Convert Word document (DOCX) to PDF
   * @param file - Word document file
   * @param options - Conversion options
   */
  static async wordToPdf(
    file: File,
    options: WordToPdfOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      // Read the DOCX file
      const arrayBuffer = await this.readFileAsArrayBuffer(file);

      // Convert DOCX to HTML using mammoth
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          convertImage: options.includeImages
            ? mammoth.images.imgElement((image: any) => {
              return image.read('base64').then((imageBuffer: any) => {
                return {
                  src: `data:${image.contentType};base64,${imageBuffer}`,
                };
              });
            })
            : undefined,
          styleMap: options.preserveStyles ? [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
          ] : undefined,
        }
      );

      // Create HTML document with proper styling
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${this.getWordLayoutCSS(options.maintainLayout)}
          </style>
        </head>
        <body>
          ${result.value}
        </body>
        </html>
      `;

      // Create a temporary container for html2canvas
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '816px'; // A4 width
      document.body.appendChild(container);

      // Use html2canvas to render the HTML
      const canvas = await html2canvas(container.querySelector('body')!, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Clean up
      document.body.removeChild(container);

      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      // Get PDF as Blob
      const pdfBlob = pdf.output('blob');
      const resultData = this.createResult(pdfBlob, file.name);

      return {
        success: true,
        data: resultData,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to convert Word document to PDF',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // EXCEL TO PDF
  // ============================================================================

  /**
   * Convert Excel spreadsheet (XLSX) to PDF
   * @param file - Excel file
   * @param options - Conversion options
   */
  static async excelToPdf(
    file: File,
    options: ExcelToPdfOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      // Read the Excel file
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Determine which sheets to process
      const sheetsToProcess = options.sheets && options.sheets.length > 0
        ? workbook.SheetNames.filter((name: string) => options.sheets!.includes(name))
        : workbook.SheetNames;

      if (sheetsToProcess.length === 0) {
        throw new Error('No sheets found to convert');
      }

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstSheet = true;

      for (const sheetName of sheetsToProcess) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) continue;

        // Add new page for each sheet (except first)
        if (!isFirstSheet) {
          pdf.addPage();
        }
        isFirstSheet = false;

        // Add sheet title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(sheetName, 14, 15);

        // Prepare table data
        const headers = jsonData[0] || [];
        const body = jsonData.slice(1);

        // Create table using jspdf-autotable
        autoTable(pdf, {
          head: [headers],
          body: body,
          startY: 25,
          theme: 'grid',
          styles: {
            fontSize: options.maintainLayout ? 8 : 9,
            cellPadding: 2,
            overflow: 'linebreak',
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: options.fitToWidth ? {
            // Auto-fit columns
          } : undefined,
          margin: { top: 20, right: 10, bottom: 10, left: 10 },
          didDrawPage: (data: any) => {
            // Add page numbers
            const pageCount = (pdf as any).internal.getNumberOfPages();
            const pageSize = pdf.internal.pageSize;
            const pageHeight = pageSize.height || pageSize.getHeight();
            pdf.setFontSize(8);
            pdf.text(
              `Page ${data.pageNumber} of ${pageCount}`,
              data.settings.margin.left,
              pageHeight - 10
            );
          },
        });
      }

      // Get PDF as Blob
      const pdfBlob = pdf.output('blob');
      const resultData = this.createResult(pdfBlob, file.name);

      return {
        success: true,
        data: resultData,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to convert Excel document to PDF',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // POWERPOINT TO PDF (Future Implementation)
  // ============================================================================

  /**
   * Convert PowerPoint presentation (PPTX) to PDF
   * Note: This is a placeholder for future implementation
   * PowerPoint conversion is complex and may require server-side processing
   */
  static async powerpointToPdf(
    file: File
  ): Promise<ServiceResponse<FileProcessingResult>> {
    return {
      success: false,
      error: 'PowerPoint to PDF conversion is not yet implemented. Please use Word or Excel files.',
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Detect Office document type
   */
  static detectDocumentType(file: File): 'word' | 'excel' | 'powerpoint' | 'unknown' {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'doc':
      case 'docx':
        return 'word';
      case 'xls':
      case 'xlsx':
        return 'excel';
      case 'ppt':
      case 'pptx':
        return 'powerpoint';
      default:
        return 'unknown';
    }
  }

  /**
   * Get Excel workbook metadata
   */
  static async getExcelMetadata(file: File): Promise<{
    sheetNames: string[];
    sheetCount: number;
  }> {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    return {
      sheetNames: workbook.SheetNames,
      sheetCount: workbook.SheetNames.length,
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
}
