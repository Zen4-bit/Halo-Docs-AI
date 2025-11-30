import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

const execAsync = promisify(exec);

export interface GifProcessingOptions {
  optimizationLevel?: number;
  lossy?: number;
  colors?: number;
  interlace?: boolean;
  method?: 'gifsicle' | 'sharp';
}

export interface ProcessedGifResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  frames?: number;
}

export class GifProcessor {
  private static tempDir = path.join(os.tmpdir(), 'gif-processing');

  private static async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  private static async createTempFile(buffer: Buffer, extension: string = '.gif'): Promise<string> {
    await this.ensureTempDir();
    const tempFilePath = path.join(this.tempDir, `temp-${Date.now()}${extension}`);
    await fs.writeFile(tempFilePath, buffer);
    return tempFilePath;
  }

  private static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Failed to cleanup temp file:', error);
    }
  }

  /**
   * Compress GIF using Gifsicle
   */
  static async compressGif(
    buffer: Buffer,
    options: GifProcessingOptions = {}
  ): Promise<ProcessedGifResult> {
    const originalSize = buffer.length;
    let inputPath: string | undefined;
    let outputPath: string | undefined;

    try {
      // Create temporary files
      inputPath = await this.createTempFile(buffer);
      outputPath = await this.createTempFile(Buffer.alloc(0));

      // Build gifsicle command
      const command = this.buildGifsicleCommand(inputPath, outputPath, options);

      try {
        // Execute gifsicle
        await execAsync(command);
      } catch (execError) {
        console.error('Gifsicle execution error:', execError);
        
        // If gifsicle fails, try using Sharp as a fallback
        if (options.method === 'sharp') {
          return this.compressGifWithSharp(buffer, options);
        } else {
          throw execError;
        }
      }

      // Read the compressed result
      const compressedBuffer = await fs.readFile(outputPath);
      const compressedSize = compressedBuffer.length;
      
      // If the compressed file is empty or invalid, fall back to Sharp
      if (compressedSize === 0 || compressedSize >= originalSize) {
        return this.compressGifWithSharp(buffer, options);
      }
      
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      // Get GIF dimensions using Sharp
      const metadata = await sharp(compressedBuffer).metadata();

      return {
        buffer: compressedBuffer,
        originalSize,
        compressedSize,
        compressionRatio,
        width: metadata.width || 0,
        height: metadata.height || 0,
        frames: metadata.pages || 1,
      };
    } catch (error) {
      // If anything fails, try Sharp as a last resort
      try {
        return this.compressGifWithSharp(buffer, options);
      } catch (sharpError) {
        throw new Error(`GIF compression failed: ${error}. Sharp fallback also failed: ${sharpError}`);
      }
    } finally {
      // Cleanup temporary files
      if (inputPath) await this.cleanupTempFile(inputPath);
      if (outputPath) await this.cleanupTempFile(outputPath);
    }
  }
  
  /**
   * Compress GIF using Sharp as a fallback
   */
  private static async compressGifWithSharp(
    buffer: Buffer,
    options: GifProcessingOptions = {}
  ): Promise<ProcessedGifResult> {
    const originalSize = buffer.length;
    
    try {
      // Get original metadata
      const originalMetadata = await sharp(buffer).metadata();
      
      // Process with Sharp
      const pipeline = sharp(buffer, { animated: true });
      
      const processedBuffer = await pipeline.gif({
        effort: options.optimizationLevel || 7,
        colours: options.colors || 256,
        dither: 0.8
      }).toBuffer();
      
      const compressedSize = processedBuffer.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
      
      // Get processed metadata
      const metadata = await sharp(processedBuffer).metadata();
      
      return {
        buffer: processedBuffer,
        originalSize,
        compressedSize,
        compressionRatio,
        width: metadata.width || originalMetadata.width || 0,
        height: metadata.height || originalMetadata.height || 0,
        frames: metadata.pages || originalMetadata.pages || 1,
      };
    } catch (error) {
      throw new Error(`Sharp GIF compression failed: ${error}`);
    }
  }

  /**
   * Build gifsicle command with options
   */
  private static buildGifsicleCommand(
    inputPath: string,
    outputPath: string,
    options: GifProcessingOptions
  ): string {
    // Check if we're on Windows
    const isWindows = process.platform === 'win32';
    
    // On Windows, we need to use a different approach to redirect output
    if (isWindows) {
      let command = 'gifsicle';

      // Optimization level (1-3)
      const level = options.optimizationLevel || 2;
      command += ` -O${level}`;

      // Lossy compression (0-200)
      if (options.lossy && options.lossy > 0) {
        command += ` --lossy=${options.lossy}`;
      }

      // Color reduction
      if (options.colors && options.colors < 256) {
        command += ` --colors=${options.colors}`;
      }

      // Interlace
      if (options.interlace) {
        command += ' --interlace';
      }

      // Output file
      command += ` -o "${outputPath}" "${inputPath}"`;

      return command;
    } else {
      // Unix-like systems
      let command = 'gifsicle';

      // Optimization level (1-3)
      const level = options.optimizationLevel || 2;
      command += ` -O${level}`;

      // Lossy compression (0-200)
      if (options.lossy && options.lossy > 0) {
        command += ` --lossy=${options.lossy}`;
      }

      // Color reduction
      if (options.colors && options.colors < 256) {
        command += ` --colors=${options.colors}`;
      }

      // Interlace
      if (options.interlace) {
        command += ' --interlace';
      }

      // Input and output files
      command += ` "${inputPath}" > "${outputPath}"`;

      return command;
    }
  }

  /**
   * Optimize GIF for web (balanced compression)
   */
  static async optimizeForWeb(buffer: Buffer): Promise<ProcessedGifResult> {
    return this.compressGif(buffer, {
      optimizationLevel: 3,
      lossy: 80,
      colors: 256,
      interlace: false,
    });
  }

  /**
   * Maximum compression (smallest file size)
   */
  static async maximumCompression(buffer: Buffer): Promise<ProcessedGifResult> {
    return this.compressGif(buffer, {
      optimizationLevel: 3,
      lossy: 200,
      colors: 128,
      interlace: false,
    });
  }

  /**
   * Lossless compression (preserve quality)
   */
  static async losslessCompression(buffer: Buffer): Promise<ProcessedGifResult> {
    return this.compressGif(buffer, {
      optimizationLevel: 3,
      lossy: 0,
      interlace: false,
    });
  }

  /**
   * Check if gifsicle is available
   */
  static async isGifsicleAvailable(): Promise<boolean> {
    try {
      await execAsync('gifsicle --version');
      return true;
    } catch {
      return false;
    }
  }
}

export default GifProcessor;
