// Image Processing Worker
// Handles image compression, resize, crop using Canvas API and browser-image-compression

import imageCompression from 'browser-image-compression';

// Fix for TypeScript not recognizing Worker scope
declare const self: DedicatedWorkerGlobalScope;

// Message types
type ProcessType =
    | 'compress'
    | 'resize'
    | 'crop'
    | 'convert';

interface ProcessOptions {
    type: ProcessType;
    quality?: number; // 0-100
    maxWidth?: number;
    maxHeight?: number;
    format?: 'jpeg' | 'png' | 'webp' | 'gif';
    crop?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    maintainAspectRatio?: boolean;
    fileName?: string;
    fileType?: string;
}

// Memory threshold (e.g., 100MB for images)
const MEMORY_THRESHOLD = 100 * 1024 * 1024;

// Main processing function
async function processImage(
    buffer: ArrayBuffer,
    options: ProcessOptions
): Promise<Blob> {
    // Memory Guard
    if (buffer.byteLength > MEMORY_THRESHOLD) {
        throw new Error('Image too large for browser processing. Please use a smaller image.');
    }

    // Create File object from buffer
    const file = new File(
        [buffer],
        options.fileName || 'image',
        { type: options.fileType || 'image/jpeg' }
    );

    try {
        switch (options.type) {
            case 'compress':
                return await compressImage(file, options);
            case 'resize':
                return await resizeImage(file, options);
            case 'crop':
                return await cropImage(file, options);
            case 'convert':
                return await convertImage(file, options);
            default:
                throw new Error('Unknown process type');
        }
    } catch (error: any) {
        throw new Error(`Image processing failed: ${error.message}`);
    }
}

// Compress image using browser-image-compression
async function compressImage(
    file: File,
    options: ProcessOptions
): Promise<Blob> {
    const compressionOptions = {
        maxSizeMB: 10,
        // Fix: Only include maxWidthOrHeight if defined
        ...(options.maxWidth ? { maxWidthOrHeight: options.maxWidth } : {}),
        useWebWorker: false, // We're already in a worker
        fileType: getMimeType(options.format || 'jpeg'),
        initialQuality: (options.quality || 80) / 100,
        onProgress: (progress: number) => {
            self.postMessage({ event: 'progress', data: { progress } });
        },
    };

    const compressed = await imageCompression(file, compressionOptions);
    return compressed;
}

// Resize image using OffscreenCanvas
async function resizeImage(
    file: File,
    options: ProcessOptions
): Promise<Blob> {
    const imageBitmap = await createImageBitmap(file);

    let { width, height } = imageBitmap;
    const targetWidth = options.maxWidth || width;
    const targetHeight = options.maxHeight || height;

    // Calculate dimensions maintaining aspect ratio if needed
    if (options.maintainAspectRatio !== false) {
        const ratio = Math.min(targetWidth / width, targetHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    } else {
        width = targetWidth;
        height = targetHeight;
    }

    // Use OffscreenCanvas for better performance
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    // Use high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    imageBitmap.close();

    return await canvas.convertToBlob({
        type: getMimeType(options.format || 'jpeg'),
        quality: (options.quality || 90) / 100,
    });
}

// Crop image using OffscreenCanvas
async function cropImage(
    file: File,
    options: ProcessOptions
): Promise<Blob> {
    if (!options.crop) {
        throw new Error('Crop dimensions not specified');
    }

    const imageBitmap = await createImageBitmap(file);
    const { x, y, width, height } = options.crop;

    // Create cropped bitmap
    const croppedBitmap = await createImageBitmap(imageBitmap, x, y, width, height);

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    ctx.drawImage(croppedBitmap, 0, 0);

    imageBitmap.close();
    croppedBitmap.close();

    return await canvas.convertToBlob({
        type: getMimeType(options.format || 'png'),
        quality: (options.quality || 95) / 100,
    });
}

// Convert image format
async function convertImage(
    file: File,
    options: ProcessOptions
): Promise<Blob> {
    const imageBitmap = await createImageBitmap(file);
    const { width, height } = imageBitmap;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    // Handle transparency for PNG/WebP
    if (options.format === 'png' || options.format === 'webp') {
        ctx.clearRect(0, 0, width, height);
    }

    ctx.drawImage(imageBitmap, 0, 0);
    imageBitmap.close();

    return await canvas.convertToBlob({
        type: getMimeType(options.format || 'jpeg'),
        quality: (options.quality || 90) / 100,
    });
}

// Helper: Get MIME type
function getMimeType(format: string): string {
    const types: Record<string, string> = {
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
    };
    return types[format.toLowerCase()] || 'image/jpeg';
}

// Message handler
(self as any).addEventListener('message', async (e: MessageEvent) => {
    const { action, taskId, buffer, options } = e.data;

    if (action !== 'process') return;

    try {
        self.postMessage({ event: 'progress', data: { progress: 10 }, taskId });

        const blob = await processImage(buffer, { ...options, type: options.type || 'compress' });

        self.postMessage({ event: 'progress', data: { progress: 90 }, taskId });

        // Convert Blob to ArrayBuffer for transfer
        const resultBuffer = await blob.arrayBuffer();

        self.postMessage(
            {
                event: 'done',
                data: { result: resultBuffer },
                taskId,
            },
            [resultBuffer]
        );
    } catch (error: any) {
        self.postMessage({
            event: 'error',
            data: { message: error.message || 'Image processing failed' },
            taskId,
        });
    }
});

export { };


