import ytDlp from 'yt-dlp-exec';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface VideoDownloadOptions {
  format: 'mp4' | 'mp3';
  quality?: 'highest' | 'medium' | 'lowest';
  resolution?: string;
  audioQuality?: 'best' | 'worst';
  timeout?: number;
  subtitles?: boolean;
}

export interface VideoDownloadResult {
  buffer: Buffer;
  filename: string;
  title: string;
  duration: number | undefined;
  format: string;
  size: number;
}

export class VideoDownloader {
  private static tempDir = path.join(os.tmpdir(), 'video-downloads');

  private static async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  private static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Failed to cleanup temp file:', error);
    }
  }

  /**
   * Download video or audio from YouTube URL
   */
  static async downloadFromUrl(
    url: string,
    options: VideoDownloadOptions = { format: 'mp4' }
  ): Promise<VideoDownloadResult> {
    await this.ensureTempDir();

    const tempId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const outputPath = path.join(this.tempDir, `${tempId}.%(ext)s`);

    try {
      // Build yt-dlp options based on format and quality
      const ytdlpOptions = this.buildYtDlpOptions(url, outputPath, options);

      // Set up timeout if specified
      let downloadPromise = ytDlp(url, ytdlpOptions);

      if (options.timeout && options.timeout > 0) {
        const timeoutMs = options.timeout;
        downloadPromise = Promise.race([
          downloadPromise,
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Download timed out after ${timeoutMs / 1000} seconds`)), timeoutMs);
          })
        ]);
      }

      // Download the video/audio
      const result = await downloadPromise;

      // Find the downloaded file
      const downloadedFile = await this.findDownloadedFile(tempId);
      if (!downloadedFile) {
        throw new Error('Downloaded file not found');
      }

      // Read file into buffer
      const buffer = await fs.readFile(downloadedFile.path);
      const filename = this.generateFilename(downloadedFile.title, options.format);

      const downloadResult: VideoDownloadResult = {
        buffer,
        filename,
        title: downloadedFile.title,
        duration: downloadedFile.duration,
        format: options.format,
        size: buffer.length,
      };

      // Cleanup temp file
      await this.cleanupTempFile(downloadedFile.path);

      return downloadResult;
    } catch (error) {
      throw new Error(`Video download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build yt-dlp options
   */
  private static buildYtDlpOptions(
    url: string,
    outputPath: string,
    options: VideoDownloadOptions
  ): any {
    const baseOptions = {
      url,
      output: outputPath,
      noPlaylist: true,
      limitRate: '10M', // Limit download speed to avoid overwhelming the server
      noCallHome: true,  // Privacy enhancement
      preferFreeFormats: true, // Prefer free formats over non-free ones
    };

    if (options.format === 'mp3') {
      return {
        ...baseOptions,
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: options.audioQuality || 'best',
        embedThumbnail: false,
        addMetadata: true,
      };
    } else {
      // Video format
      const formatSelector = this.getVideoFormatSelector(options.quality, options.resolution);

      // Create video options with proper type handling
      const videoOptions: Record<string, any> = {
        ...baseOptions,
        format: formatSelector,
        mergeOutputFormat: 'mp4',
      };

      // Handle subtitles if requested
      if (options.subtitles) {
        videoOptions.writeAutoSubtitles = true;
        videoOptions.subFormat = 'srt';
        videoOptions.embedSubs = true;
      } else {
        videoOptions.embedSubs = false;
        videoOptions.writeSubtitles = false;
      }

      return videoOptions;
    }
  }

  /**
   * Get video format selector based on quality and resolution
   */
  private static getVideoFormatSelector(
    quality?: string,
    resolution?: string
  ): string {
    if (resolution) {
      // Specific resolution
      return `best[height<=${resolution}][ext=mp4]/best[height<=${resolution}]/best[ext=mp4]/best`;
    }

    switch (quality) {
      case 'lowest':
        return 'worst[ext=mp4]/worst';
      case 'medium':
        return 'best[height<=720][ext=mp4]/best[height<=720]/best[ext=mp4]/best';
      case 'highest':
      default:
        return 'best[ext=mp4]/best';
    }
  }

  /**
   * Find the downloaded file by temp ID
   */
  private static async findDownloadedFile(tempId: string): Promise<{
    path: string;
    title: string;
    duration: number | undefined;
  } | null> {
    try {
      const files = await fs.readdir(this.tempDir);
      const downloadedFile = files.find(file => file.startsWith(tempId));

      if (!downloadedFile) {
        return null;
      }

      const filePath = path.join(this.tempDir, downloadedFile);
      const stats = await fs.stat(filePath);

      // Extract title from filename or use a default
      const title = this.extractTitleFromFilename(downloadedFile) || 'Downloaded Media';

      return {
        path: filePath,
        title,
        duration: undefined, // We could extract this with yt-dlp --get-duration if needed
      };
    } catch (error) {
      console.error('Error finding downloaded file:', error);
      return null;
    }
  }

  /**
   * Extract clean title from filename
   */
  private static extractTitleFromFilename(filename: string): string {
    // Remove temp ID and extension
    const cleanName = filename.replace(/^download-\d+-[a-z0-9]+\./, '').replace(/\.[^.]+$/, '');

    // Replace underscores and hyphens with spaces
    return cleanName.replace(/[_-]/g, ' ').trim();
  }

  /**
   * Generate safe filename
   */
  private static generateFilename(title: string, format: string): string {
    // Sanitize title for filename
    const safeTitle = title
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    const extension = format === 'mp3' ? '.mp3' : '.mp4';
    return `${safeTitle}${extension}`;
  }

  /**
   * Get video info without downloading
   */
  static async getVideoInfo(url: string): Promise<{
    title: string;
    duration: number;
    uploader: string;
    viewCount: number;
    thumbnail: string;
  }> {
    try {
      const info = await ytDlp(url, {
        dumpSingleJson: true,
        noPlaylist: true,
      });

      return {
        title: info.title || 'Unknown',
        duration: info.duration || 0,
        uploader: info.uploader || 'Unknown',
        viewCount: info.view_count || 0,
        thumbnail: info.thumbnail || '',
      };
    } catch (error) {
      throw new Error(`Failed to get video info: ${error}`);
    }
  }

  /**
   * Validate YouTube URL
   */
  static isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/|youtube\.com\/shorts\/)[\w-]{11}/;
    return youtubeRegex.test(url);
  }

  /**
   * Extract video ID from YouTube URL
   */
  static extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/;
    const match = url.match(regex);
    return match ? (match[1] ?? null) : null;
  }
}

export default VideoDownloader;
