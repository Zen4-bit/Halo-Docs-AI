import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class ServerPDFProcessor {
  static async saveTempPDF(pdfBytes: Uint8Array, filename: string): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, filename);
    await fs.writeFile(tempPath, pdfBytes);
    return tempPath;
  }

  static async readTempPDF(filePath: string): Promise<Uint8Array> {
    return await fs.readFile(filePath);
  }

  static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  static async compressPDFWithGhostscript(pdfBytes: Uint8Array, quality: 'low' | 'medium' | 'high' = 'medium'): Promise<Uint8Array> {
    const inputFile = `temp-input-${Date.now()}.pdf`;
    const outputFile = `temp-output-${Date.now()}.pdf`;
    
    try {
      const inputPath = await this.saveTempPDF(pdfBytes, inputFile);
      const outputPath = path.join(process.cwd(), 'temp', outputFile);

      const qualitySettings = {
        low: '/screen',
        medium: '/ebook',
        high: '/printer'
      };

      const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${qualitySettings[quality]} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
      
      await execAsync(command);
      const compressedPdf = await this.readTempPDF(outputPath);
      
      await this.cleanupTempFile(inputPath);
      await this.cleanupTempFile(outputPath);
      
      return compressedPdf;
    } catch (error) {
      console.error('Ghostscript not available, using fallback compression:', error);
      // Fallback: Return original PDF with a warning
      return this.compressPDFBasic(pdfBytes);
    }
  }

  static async compressPDFBasic(pdfBytes: Uint8Array): Promise<Uint8Array> {
    // Basic compression fallback - just return the original PDF
    // In a real implementation, you could use pdf-lib to remove unused objects
    console.warn('Using basic PDF compression fallback. Install Ghostscript for better compression.');
    return pdfBytes;
  }

  static async repairPDFWithQPDF(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const inputFile = `temp-input-${Date.now()}.pdf`;
    const outputFile = `temp-output-${Date.now()}.pdf`;
    
    try {
      const inputPath = await this.saveTempPDF(pdfBytes, inputFile);
      const outputPath = path.join(process.cwd(), 'temp', outputFile);

      const command = `qpdf --linearize "${inputPath}" "${outputPath}"`;
      
      await execAsync(command);
      const repairedPdf = await this.readTempPDF(outputPath);
      
      await this.cleanupTempFile(inputPath);
      await this.cleanupTempFile(outputPath);
      
      return repairedPdf;
    } catch (error) {
      console.error('Error repairing PDF:', error);
      throw new Error('Failed to repair PDF');
    }
  }
}
