import { Worker } from 'worker_threads';
import { ImageProcessor, ImageProcessingOptions, ProcessedImageResult } from './image-processor';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export interface BulkProcessingOptions extends ImageProcessingOptions {
  maxConcurrency?: number;
  preserveFilenames?: boolean;
}

export interface BulkProcessingResult {
  results: ProcessedImageResult[];
  successCount: number;
  failureCount: number;
  totalProcessed: number;
  processingTime: number;
}

export class BulkProcessor {
  /**
   * Process multiple images in parallel using worker threads
   */
  static async bulkResizeImages(
    buffers: Buffer[],
    options: BulkProcessingOptions = {}
  ): Promise<BulkProcessingResult> {
    const startTime = Date.now();
    const maxConcurrency = options.maxConcurrency || 4;
    const results: ProcessedImageResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process images in batches to control concurrency
    for (let i = 0; i < buffers.length; i += maxConcurrency) {
      const batch = buffers.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (buffer, index) => {
        try {
          const result = await ImageProcessor.resizeImage(buffer, options);
          successCount++;
          return { index, result, error: null };
        } catch (error) {
          failureCount++;
          console.error(`Failed to process image ${i + index}:`, error);
          return { index, result: null, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Sort results by original index to maintain order
      batchResults.sort((a, b) => a.index - b.index);
      
      // Add successful results to the final array
      batchResults.forEach(({ result }) => {
        if (result) {
          results.push(result);
        }
      });
    }

    const processingTime = Date.now() - startTime;

    return {
      results,
      successCount,
      failureCount,
      totalProcessed: buffers.length,
      processingTime,
    };
  }

  /**
   * Process multiple images with compression
   */
  static async bulkCompressImages(
    buffers: Buffer[],
    options: BulkProcessingOptions = {}
  ): Promise<BulkProcessingResult> {
    const startTime = Date.now();
    const maxConcurrency = options.maxConcurrency || 4;
    const results: ProcessedImageResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process images in batches
    for (let i = 0; i < buffers.length; i += maxConcurrency) {
      const batch = buffers.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (buffer, index) => {
        try {
          const result = await ImageProcessor.compressImage(buffer, options);
          successCount++;
          return { index, result, error: null };
        } catch (error) {
          failureCount++;
          console.error(`Failed to compress image ${i + index}:`, error);
          return { index, result: null, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Sort results by original index to maintain order
      batchResults.sort((a, b) => a.index - b.index);
      
      // Add successful results to the final array
      batchResults.forEach(({ result }) => {
        if (result) {
          results.push(result);
        }
      });
    }

    const processingTime = Date.now() - startTime;

    return {
      results,
      successCount,
      failureCount,
      totalProcessed: buffers.length,
      processingTime,
    };
  }

  /**
   * Process images using worker threads for better performance
   */
  static async bulkProcessWithWorkers(
    buffers: Buffer[],
    options: BulkProcessingOptions = {}
  ): Promise<BulkProcessingResult> {
    const startTime = Date.now();
    const maxConcurrency = Math.min(options.maxConcurrency || 4, os.cpus().length - 1 || 1);
    const results: ProcessedImageResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Create a temporary directory for worker data
    const tempDir = await this.createTempDir();
    const workerDataFiles: string[] = [];
    
    try {
      // Create worker pool
      const workers: Worker[] = [];
      const availableWorkers: Worker[] = [];
      const workerPromises: Promise<any>[] = [];
      const pendingTasks: {buffer: Buffer, index: number}[] = [];
      
      // Initialize workers
      for (let i = 0; i < maxConcurrency; i++) {
        const worker = new Worker(`
          const { parentPort, workerData } = require('worker_threads');
          const sharp = require('sharp');
          const fs = require('fs').promises;
          
          parentPort.on('message', async (task) => {
            try {
              const { bufferPath, options, index } = task;
              const buffer = await fs.readFile(bufferPath);
              
              let pipeline = sharp(buffer);
              
              // Apply operations based on options
              if (options.width || options.height) {
                pipeline = pipeline.resize(options.width, options.height, {
                  fit: options.fit || 'cover',
                  position: options.position || 'center',
                  background: options.background || { r: 0, g: 0, b: 0, alpha: 0 },
                  withoutEnlargement: options.withoutEnlargement !== false,
                  withoutReduction: options.withoutReduction || false,
                  kernel: options.kernel || 'lanczos3',
                  fastShrinkOnLoad: options.fastShrinkOnLoad !== false,
                });
              }
              
              // Apply format-specific options
              const metadata = await sharp(buffer).metadata();
              const format = options.format || metadata.format;
              
              switch (format) {
                case 'jpeg':
                case 'jpg':
                  pipeline = pipeline.jpeg({
                    quality: options.quality || 90,
                    progressive: options.progressive !== false,
                    mozjpeg: options.mozjpeg !== false,
                  });
                  break;
                case 'png':
                  pipeline = pipeline.png({
                    quality: options.quality || 90,
                    progressive: options.progressive !== false,
                    compressionLevel: options.compressionLevel || 6,
                  });
                  break;
                case 'webp':
                  pipeline = pipeline.webp({
                    quality: options.quality || 90,
                    effort: options.effort || 4,
                  });
                  break;
                case 'gif':
                  pipeline = pipeline.gif({
                    effort: options.effort || 1,
                  });
                  break;
              }
              
              // Process the image
              const outputBuffer = await pipeline.toBuffer({ resolveWithObject: true });
              
              // Return the result
              parentPort.postMessage({
                index,
                result: {
                  buffer: outputBuffer.data,
                  format: outputBuffer.info.format,
                  width: outputBuffer.info.width,
                  height: outputBuffer.info.height,
                  size: outputBuffer.data.length,
                },
                error: null,
              });
            } catch (error) {
              parentPort.postMessage({
                index: task.index,
                result: null,
                error: error.message,
              });
            }
          });
          
          // Signal that worker is ready
          parentPort.postMessage({ type: 'ready' });
        `, { eval: true });
        
        // Set up worker message handling
        worker.on('message', (message) => {
          if (message.type === 'ready') {
            // Worker is ready to process tasks
            availableWorkers.push(worker);
            processNextTask();
          } else {
            // Worker completed a task
            if (message.error) {
              failureCount++;
              console.error(`Worker error on image ${message.index}:`, message.error);
            } else {
              successCount++;
              results[message.index] = message.result;
            }
            
            // Return worker to available pool
            availableWorkers.push(worker);
            processNextTask();
          }
        });
        
        worker.on('error', (error) => {
          console.error('Worker error:', error);
          // Try to recover by creating a new worker
          workers.splice(workers.indexOf(worker), 1);
          // Create a new worker with the same script
          const newWorker = new Worker(`
            const { parentPort, workerData } = require('worker_threads');
            const sharp = require('sharp');
            const fs = require('fs').promises;
            
            parentPort.on('message', async (task) => {
              try {
                const { bufferPath, options, index } = task;
                const buffer = await fs.readFile(bufferPath);
                
                let pipeline = sharp(buffer);
                
                // Apply operations based on options
                if (options.width || options.height) {
                  pipeline = pipeline.resize(options.width, options.height, {
                    fit: options.fit || 'cover',
                    position: options.position || 'center',
                    background: options.background || { r: 0, g: 0, b: 0, alpha: 0 },
                    withoutEnlargement: options.withoutEnlargement !== false,
                    withoutReduction: options.withoutReduction || false,
                    kernel: options.kernel || 'lanczos3',
                    fastShrinkOnLoad: options.fastShrinkOnLoad !== false,
                  });
                }
                
                // Apply format-specific options
                const metadata = await sharp(buffer).metadata();
                const format = options.format || metadata.format;
                
                switch (format) {
                  case 'jpeg':
                  case 'jpg':
                    pipeline = pipeline.jpeg({
                      quality: options.quality || 90,
                      progressive: options.progressive !== false,
                      mozjpeg: options.mozjpeg !== false,
                    });
                    break;
                  case 'png':
                    pipeline = pipeline.png({
                      quality: options.quality || 90,
                      progressive: options.progressive !== false,
                      compressionLevel: options.compressionLevel || 6,
                    });
                    break;
                  case 'webp':
                    pipeline = pipeline.webp({
                      quality: options.quality || 90,
                      effort: options.effort || 4,
                    });
                    break;
                  case 'gif':
                    pipeline = pipeline.gif({
                      effort: options.effort || 1,
                    });
                    break;
                }
                
                // Process the image
                const outputBuffer = await pipeline.toBuffer({ resolveWithObject: true });
                
                // Return the result
                parentPort.postMessage({
                  index,
                  result: {
                    buffer: outputBuffer.data,
                    format: outputBuffer.info.format,
                    width: outputBuffer.info.width,
                    height: outputBuffer.info.height,
                    size: outputBuffer.data.length,
                  },
                  error: null,
                });
              } catch (error) {
                parentPort.postMessage({
                  index: task.index,
                  result: null,
                  error: error.message,
                });
              }
            });
            
            // Signal that worker is ready
            parentPort.postMessage({ type: 'ready' });
          `, { eval: true });
          workers.push(newWorker);
        });
        
        workers.push(worker);
      }
      
      // Add all buffers to the pending tasks
      for (let i = 0; i < buffers.length; i++) {
        // Ensure buffer is not undefined
        if (buffers[i]) {
          pendingTasks.push({ buffer: buffers[i]!, index: i });
        } else {
          failureCount++;
          console.error(`Buffer at index ${i} is undefined`);
        }
      }
      
      // Process next task when a worker becomes available
      const processNextTask = async () => {
        if (pendingTasks.length === 0) {
          // No more tasks
          if (successCount + failureCount === buffers.length) {
            // All tasks completed, terminate workers
            workers.forEach(worker => worker.terminate());
          }
          return;
        }
        
        if (availableWorkers.length === 0) {
          // No available workers
          return;
        }
        
        const worker = availableWorkers.pop()!;
        const task = pendingTasks.shift()!;
        
        try {
          // Write buffer to temp file for worker
          const bufferPath = path.join(tempDir, `buffer-${task.index}.tmp`);
          await fs.writeFile(bufferPath, task.buffer);
          workerDataFiles.push(bufferPath);
          
          // Send task to worker
          worker.postMessage({
            bufferPath,
            options,
            index: task.index,
          });
        } catch (error) {
          console.error('Error preparing task:', error);
          failureCount++;
          availableWorkers.push(worker);
          processNextTask();
        }
      };
      
      // Wait for all tasks to complete
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (successCount + failureCount === buffers.length) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      
      // Filter out null results and ensure proper order
      const finalResults = results.filter(Boolean);
      
      const processingTime = Date.now() - startTime;
      
      return {
        results: finalResults,
        successCount,
        failureCount,
        totalProcessed: buffers.length,
        processingTime,
      };
    } finally {
      // Clean up temp files
      try {
        for (const file of workerDataFiles) {
          await fs.unlink(file).catch(() => {});
        }
        await fs.rmdir(tempDir).catch(() => {});
      } catch (error) {
        console.warn('Failed to clean up temporary files:', error);
      }
    }
  }
  
  /**
   * Create a temporary directory for worker data
   */
  private static async createTempDir(): Promise<string> {
    const tempDir = path.join(os.tmpdir(), `bulk-processor-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * Process a batch of images in parallel using Promise.all
   * This is a fallback method when worker threads are not available
   */
  private static async processBatchWithPromises(
    buffers: Buffer[],
    options: ImageProcessingOptions,
    startIndex: number
  ): Promise<Array<{ index: number; result: ProcessedImageResult | null; error: any }>> {
    return Promise.all(
      buffers.map(async (buffer, batchIndex) => {
        const index = startIndex + batchIndex;
        try {
          let result: ProcessedImageResult;
          
          if (options.width || options.height) {
            result = await ImageProcessor.resizeImage(buffer, options);
          } else {
            result = await ImageProcessor.compressImage(buffer, options);
          }
          
          return { index, result, error: null };
        } catch (error) {
          console.error(`Failed to process image ${index}:`, error);
          return { index, result: null, error };
        }
      })
    );
  }

  /**
   * Create a zip file containing all processed images
   * Note: This is a placeholder. In a real implementation, you would use a library like JSZip.
   */
  static async createZipFromResults(
    results: ProcessedImageResult[],
    filenames: string[]
  ): Promise<Buffer> {
    if (results.length === 0) {
      throw new Error('No results to zip');
    }
    
    // In a real implementation with JSZip:
    // const JSZip = require('jszip');
    // const zip = new JSZip();
    // 
    // results.forEach((result, index) => {
    //   const filename = filenames[index] || `image-${index}.${result.format}`;
    //   zip.file(filename, result.buffer);
    // });
    // 
    // return zip.generateAsync({ type: 'nodebuffer' });
    
    // For now, concatenate buffers as a placeholder
    const totalLength = results.reduce((sum, result) => sum + result.buffer.length, 0);
    const concatenated = Buffer.alloc(totalLength);
    
    let offset = 0;
    for (const result of results) {
      result.buffer.copy(concatenated, offset);
      offset += result.buffer.length;
    }
    
    return concatenated;
  }

  /**
   * Get processing statistics
   */
  static getProcessingStats(result: BulkProcessingResult): {
    averageProcessingTime: number;
    successRate: number;
    totalSizeReduction: number;
    averageCompressionRatio: number;
  } {
    const averageProcessingTime = result.processingTime / result.totalProcessed;
    const successRate = (result.successCount / result.totalProcessed) * 100;
    
    // Calculate size reduction if we have original sizes
    let totalSizeReduction = 0;
    let averageCompressionRatio = 0;
    
    // This would require tracking original sizes
    // For now, return placeholder values
    
    return {
      averageProcessingTime,
      successRate,
      totalSizeReduction,
      averageCompressionRatio,
    };
  }
}

export default BulkProcessor;
