/**
 * HALO Platform - Media Service
 * 100% Client-Side Media Processing using FFmpeg.wasm and browser APIs
 * 
 * Architecture: No server calls, all processing in browser
 * Libraries: ffmpeg.wasm (video), browser-image-compression (images)
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import imageCompression from 'browser-image-compression';
import type {
  ImageResizeOptions,
  ImageCompressOptions,
  ImageCropOptions,
  VideoConvertOptions,
  VideoToGifOptions,
  VideoCompressOptions,
  ServiceResponse,
  FileProcessingResult,
} from '@/types/tool-options';

/**
 * MediaService - Client-side media processing
 */
export class MediaService {
  private static ffmpegInstance: FFmpeg | null = null;
  private static isFFmpegLoading = false;
  private static ffmpegLoadPromise: Promise<FFmpeg> | null = null;

  // ============================================================================
  // FFMPEG INITIALIZATION
  // ============================================================================

  /**
   * Initialize FFmpeg (singleton pattern)
   */
  private static async getFFmpeg(): Promise<FFmpeg> {
    // Return existing instance if available
    if (this.ffmpegInstance && this.ffmpegInstance.loaded) {
      return this.ffmpegInstance;
    }

    // Wait for ongoing load
    if (this.isFFmpegLoading && this.ffmpegLoadPromise) {
      return this.ffmpegLoadPromise;
    }

    // Start loading
    this.isFFmpegLoading = true;
    this.ffmpegLoadPromise = this.loadFFmpeg();

    try {
      this.ffmpegInstance = await this.ffmpegLoadPromise;
      return this.ffmpegInstance;
    } finally {
      this.isFFmpegLoading = false;
      this.ffmpegLoadPromise = null;
    }
  }

  /**
   * Load FFmpeg WebAssembly
   */
  private static async loadFFmpeg(): Promise<FFmpeg> {
    const ffmpeg = new FFmpeg();

    // Load FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Create result object for media files
   */
  private static createResult(
    fileData: Uint8Array | Blob,
    originalFilename: string,
    suffix: string,
    mimeType: string
  ): FileProcessingResult {
    const extension = mimeType.split('/')[1] || 'bin';
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
    const blob = fileData instanceof Blob ? fileData : new Blob([fileData as BlobPart], { type: mimeType });
    
    return {
      file: blob,
      originalFilename,
      outputFilename: `${nameWithoutExt}-${suffix}.${extension}`,
      fileSize: blob.size,
      mimeType,
    };
  }

  /**
   * Get quality settings for compression
   */
  private static getQualitySettings(quality: 'high' | 'medium' | 'low'): {
    crf: number;
    preset: string;
  } {
    switch (quality) {
      case 'high':
        return { crf: 18, preset: 'slow' };
      case 'medium':
        return { crf: 23, preset: 'medium' };
      case 'low':
        return { crf: 28, preset: 'fast' };
    }
  }

  // ============================================================================
  // IMAGE RESIZE
  // ============================================================================

  /**
   * Resize image using Canvas API
   * @param file - Image file
   * @param options - Resize options
   */
  static async resizeImage(
    file: File,
    options: ImageResizeOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      // Load image
      const img = await this.loadImage(file);

      // Calculate dimensions
      let targetWidth = options.width;
      let targetHeight = options.height;

      if (options.maintainAspect) {
        const aspectRatio = img.width / img.height;
        if (options.width && !options.height) {
          targetHeight = Math.round(options.width / aspectRatio);
        } else if (options.height && !options.width) {
          targetWidth = Math.round(options.height * aspectRatio);
        } else {
          // Fit within dimensions
          if (img.width / options.width > img.height / options.height) {
            targetHeight = Math.round(options.width / aspectRatio);
          } else {
            targetWidth = Math.round(options.height * aspectRatio);
          }
        }
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Convert to blob
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
          0.95
        );
      });

      const result = this.createResult(
        blob,
        file.name,
        `resized-${targetWidth}x${targetHeight}`,
        `image/${options.format}`
      );

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to resize image',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Load image from file
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // ============================================================================
  // IMAGE COMPRESS
  // ============================================================================

  /**
   * Compress image using browser-image-compression
   * @param file - Image file
   * @param options - Compression options
   */
  static async compressImage(
    file: File,
    options: ImageCompressOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      const compressionOptions: any = {
        useWebWorker: true,
        initialQuality: options.quality,
      };
      
      if (options.maxSizeKB) {
        compressionOptions.maxSizeMB = options.maxSizeKB / 1024;
      }
      if (options.format) {
        compressionOptions.fileType = `image/${options.format}`;
      }

      const compressedFile = await imageCompression(file, compressionOptions);
      
      const result = this.createResult(
        compressedFile,
        file.name,
        'compressed',
        compressedFile.type
      );

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to compress image',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // IMAGE CROP
  // ============================================================================

  /**
   * Crop image using Canvas API
   * @param file - Image file
   * @param options - Crop options
   */
  static async cropImage(
    file: File,
    options: ImageCropOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      // Load image
      const img = await this.loadImage(file);

      // Validate crop area
      if (options.x < 0 || options.y < 0 || 
          options.x + options.width > img.width || 
          options.y + options.height > img.height) {
        throw new Error('Crop area exceeds image boundaries');
      }

      // Create canvas for cropped image
      const canvas = document.createElement('canvas');
      canvas.width = options.width;
      canvas.height = options.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw cropped portion
      ctx.drawImage(
        img,
        options.x, options.y, options.width, options.height,
        0, 0, options.width, options.height
      );

      // Convert to blob
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
          0.95
        );
      });

      const result = this.createResult(
        blob,
        file.name,
        'cropped',
        `image/${options.format}`
      );

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to crop image',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // VIDEO CONVERSION
  // ============================================================================

  /**
   * Convert video using FFmpeg
   * @param file - Video file
   * @param options - Conversion options
   */
  static async convertVideo(
    file: File,
    options: VideoConvertOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      const ffmpeg = await this.getFFmpeg();

      // Write input file
      const inputName = 'input.' + file.name.split('.').pop();
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Prepare output filename
      let outputName = '';
      let ffmpegArgs: string[] = ['-i', inputName];

      // Configure based on target format
      switch (options.targetFormat) {
        case 'mp3':
          outputName = 'output.mp3';
          ffmpegArgs.push(
            '-vn', // No video
            '-acodec', 'libmp3lame',
            '-q:a', options.quality === 'high' ? '2' : options.quality === 'medium' ? '4' : '6'
          );
          break;

        case 'mp4':
          outputName = 'output.mp4';
          const qualitySettings = this.getQualitySettings(options.quality);
          ffmpegArgs.push(
            '-c:v', 'libx264',
            '-crf', qualitySettings.crf.toString(),
            '-preset', qualitySettings.preset,
            '-c:a', 'aac',
            '-b:a', '128k'
          );
          break;

        case 'gif':
          // Use VideoToGif method instead
          return this.videoToGif(file, {
            startTime: options.startTime || 0,
            duration: 3,
            width: 480,
            fps: 10,
            quality: 0.8,
          });
      }

      // Add trimming if specified
      if (options.startTime !== undefined) {
        ffmpegArgs.splice(1, 0, '-ss', options.startTime.toString());
      }
      if (options.endTime !== undefined && options.startTime !== undefined) {
        const duration = options.endTime - options.startTime;
        ffmpegArgs.push('-t', duration.toString());
      }

      // Add output filename
      ffmpegArgs.push(outputName);

      // Execute conversion
      await ffmpeg.exec(ffmpegArgs);

      // Read output file
      const data = await ffmpeg.readFile(outputName);
      const outputBlob = new Blob([data as BlobPart], { 
        type: options.targetFormat === 'mp3' ? 'audio/mpeg' : 'video/mp4' 
      });

      // Clean up
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      const result = this.createResult(
        outputBlob,
        file.name,
        `converted`,
        outputBlob.type
      );

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to convert video',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // VIDEO TO GIF
  // ============================================================================

  /**
   * Convert video to GIF using FFmpeg
   * @param file - Video file
   * @param options - GIF conversion options
   */
  static async videoToGif(
    file: File,
    options: VideoToGifOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      const ffmpeg = await this.getFFmpeg();

      // Write input file
      const inputName = 'input.' + file.name.split('.').pop();
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Prepare FFmpeg arguments
      const outputName = 'output.gif';
      const ffmpegArgs = [
        '-i', inputName,
        '-ss', options.startTime.toString(),
        '-t', Math.min(options.duration, 10).toString(), // Max 10 seconds
        '-vf', `fps=${options.fps},scale=${options.width}:-1:flags=lanczos`,
        outputName
      ];

      // Execute conversion
      await ffmpeg.exec(ffmpegArgs);

      // Read output file
      const data = await ffmpeg.readFile(outputName);
      const outputBlob = new Blob([data as BlobPart], { type: 'image/gif' });

      // Clean up
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      const result = this.createResult(
        outputBlob,
        file.name,
        'animated',
        'image/gif'
      );

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to convert video to GIF',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // VIDEO COMPRESSION
  // ============================================================================

  /**
   * Compress video using FFmpeg
   * @param file - Video file
   * @param options - Compression options
   */
  static async compressVideo(
    file: File,
    options: VideoCompressOptions
  ): Promise<ServiceResponse<FileProcessingResult>> {
    const startTime = Date.now();

    try {
      const ffmpeg = await this.getFFmpeg();

      // Write input file
      const inputName = 'input.' + file.name.split('.').pop();
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Prepare FFmpeg arguments
      const outputName = 'output.mp4';
      const qualitySettings = this.getQualitySettings(options.compressionLevel);
      const ffmpegArgs = [
        '-i', inputName,
        '-c:v', 'libx264',
        '-crf', qualitySettings.crf.toString(),
        '-preset', qualitySettings.preset,
      ];

      // Add resolution scaling if specified
      if (options.resolution) {
        const resolutionMap: Record<string, string> = {
          '1080p': '1920:1080',
          '720p': '1280:720',
          '480p': '854:480',
          '360p': '640:360',
        };
        ffmpegArgs.push('-vf', `scale=${resolutionMap[options.resolution]}`);
      }

      // Add bitrate if specified
      if (options.bitrate) {
        ffmpegArgs.push('-b:v', `${options.bitrate}k`);
      }

      // Add audio codec
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '128k');

      // Add output filename
      ffmpegArgs.push(outputName);

      // Execute compression
      await ffmpeg.exec(ffmpegArgs);

      // Read output file
      const data = await ffmpeg.readFile(outputName);
      const outputBlob = new Blob([data as BlobPart], { type: 'video/mp4' });

      // Clean up
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      const result = this.createResult(
        outputBlob,
        file.name,
        'compressed',
        'video/mp4'
      );

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to compress video',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

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
   * Unload FFmpeg to free memory
   */
  static async unloadFFmpeg(): Promise<void> {
    if (this.ffmpegInstance) {
      this.ffmpegInstance = null;
    }
  }
}
