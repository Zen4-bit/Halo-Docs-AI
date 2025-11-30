import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

export interface ImageProcessingOptions {
  quality?: number;
  width?: number;
  height?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  format?: 'jpeg' | 'jpg' | 'png' | 'webp' | 'gif';
  progressive?: boolean;
  mozjpeg?: boolean;
  effort?: number;
}

export interface ProcessedImageResult {
  buffer: Buffer;
  format: string;
  size: number;
  width: number;
  height: number;
}

export class ImageProcessor {
  static async getImageInfo(buffer: Buffer): Promise<{
    format: string;
    width: number;
    height: number;
    size: number;
    channels: number;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();
      const fileType = await fileTypeFromBuffer(buffer);
      
      return {
        format: fileType?.ext || metadata.format || 'unknown',
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
        channels: metadata.channels || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get image info: ${error}`);
    }
  }

  static async compressImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult> {
    try {
      const imageInfo = await this.getImageInfo(buffer);
      let pipeline = sharp(buffer);

      // Set format based on input or options
      const targetFormat = options.format || imageInfo.format as any;
      
      switch (targetFormat) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({
            quality: options.quality || 80,
            progressive: options.progressive !== false,
            mozjpeg: options.mozjpeg !== false,
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            quality: options.quality || 80,
            progressive: options.progressive !== false,
            compressionLevel: options.effort || 6,
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality: options.quality || 80,
            effort: options.effort || 4,
          });
          break;
        case 'gif':
          // For GIF, we need to handle frames
          if (imageInfo.format === 'gif') {
            pipeline = pipeline.gif({
              effort: options.effort || 1,
            });
          } else {
            // Convert non-GIF to GIF
            pipeline = pipeline.gif({
              effort: options.effort || 1,
            });
          }
          break;
      }

      const processedBuffer = await pipeline.toBuffer();
      const processedInfo = await this.getImageInfo(processedBuffer);

      return {
        buffer: processedBuffer,
        format: processedInfo.format,
        size: processedInfo.size,
        width: processedInfo.width,
        height: processedInfo.height,
      };
    } catch (error) {
      throw new Error(`Failed to compress image: ${error}`);
    }
  }

  static async resizeImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult> {
    try {
      let pipeline = sharp(buffer);

      if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height, {
          fit: 'cover',
          position: 'center',
        });
      }

      // Maintain original format unless specified
      if (options.format) {
        switch (options.format) {
          case 'jpeg':
          case 'jpg':
            pipeline = pipeline.jpeg({ quality: options.quality || 90 });
            break;
          case 'png':
            pipeline = pipeline.png({ quality: options.quality || 90 });
            break;
          case 'webp':
            pipeline = pipeline.webp({ quality: options.quality || 90 });
            break;
        }
      }

      const processedBuffer = await pipeline.toBuffer();
      const processedInfo = await this.getImageInfo(processedBuffer);

      return {
        buffer: processedBuffer,
        format: processedInfo.format,
        size: processedInfo.size,
        width: processedInfo.width,
        height: processedInfo.height,
      };
    } catch (error) {
      throw new Error(`Failed to resize image: ${error}`);
    }
  }

  static async cropImage(
    buffer: Buffer,
    crop: { x: number; y: number; width: number; height: number },
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult> {
    try {
      let pipeline = sharp(buffer);

      pipeline = pipeline.extract({
        left: Math.round(crop.x),
        top: Math.round(crop.y),
        width: Math.round(crop.width),
        height: Math.round(crop.height),
      });

      // Maintain original format unless specified
      if (options.format) {
        switch (options.format) {
          case 'jpeg':
          case 'jpg':
            pipeline = pipeline.jpeg({ quality: options.quality || 90 });
            break;
          case 'png':
            pipeline = pipeline.png({ quality: options.quality || 90 });
            break;
          case 'webp':
            pipeline = pipeline.webp({ quality: options.quality || 90 });
            break;
        }
      }

      const processedBuffer = await pipeline.toBuffer();
      const processedInfo = await this.getImageInfo(processedBuffer);

      return {
        buffer: processedBuffer,
        format: processedInfo.format,
        size: processedInfo.size,
        width: processedInfo.width,
        height: processedInfo.height,
      };
    } catch (error) {
      throw new Error(`Failed to crop image: ${error}`);
    }
  }

  static async processGifFrames(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult> {
    try {
      // For GIF processing, we need to handle animation frames
      const pipeline = sharp(buffer, { animated: true });
      
      if (options.width || options.height) {
        pipeline.resize(options.width, options.height, {
          fit: 'cover',
          position: 'center',
        });
      }

      pipeline.gif({
        effort: options.effort || 1,
      });

      const processedBuffer = await pipeline.toBuffer();
      const processedInfo = await this.getImageInfo(processedBuffer);

      return {
        buffer: processedBuffer,
        format: processedInfo.format,
        size: processedInfo.size,
        width: processedInfo.width,
        height: processedInfo.height,
      };
    } catch (error) {
      throw new Error(`Failed to process GIF: ${error}`);
    }
  }

  static validateImageFile(buffer: Buffer): boolean {
    try {
      // Check if it's a valid image by trying to get metadata
      sharp(buffer).metadata();
      return true;
    } catch {
      return false;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export function createDownloadUrl(buffer: ArrayBuffer, filename: string): string {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  return URL.createObjectURL(blob);
}

export function downloadFile(buffer: ArrayBuffer, filename: string): void {
  const url = createDownloadUrl(buffer, filename);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
