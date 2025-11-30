// FFmpeg WebAssembly Worker
// Handles all video processing tasks in a separate thread

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

// Fix for TypeScript not recognizing Worker scope
declare const self: DedicatedWorkerGlobalScope;

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

// Memory threshold (e.g., 1GB)
const MEMORY_THRESHOLD = 1024 * 1024 * 1024;

// Initialize FFmpeg
async function loadFFmpeg() {
    if (isLoaded && ffmpeg) return ffmpeg;

    try {
        ffmpeg = new FFmpeg();

        // Load FFmpeg wasm files from CDN
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        await ffmpeg.load({
            coreURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.js`,
                'text/javascript'
            ),
            wasmURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.wasm`,
                'application/wasm'
            ),
        });

        isLoaded = true;

        // Set up progress listener
        ffmpeg.on('progress', ({ progress }) => {
            self.postMessage({
                event: 'progress',
                data: { progress: Math.round(progress * 100) },
            });
        });

        ffmpeg.on('log', ({ message }) => {
            // console.log('FFmpeg:', message);
        });

        return ffmpeg;
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        throw new Error('Failed to initialize FFmpeg');
    }
}

// Process video/audio conversion
async function processMedia(
    buffer: ArrayBuffer,
    options: {
        format: 'mp4' | 'mp3' | 'webm' | 'avi';
        quality?: 'high' | 'medium' | 'low';
        audioBitrate?: string;
        videoBitrate?: string;
        fileName?: string;
    }
) {
    // Memory Guard
    if (buffer.byteLength > MEMORY_THRESHOLD) {
        throw new Error('File too large for browser processing. Please use a smaller file.');
    }

    try {
        const ffmpegInstance = await loadFFmpeg();
        if (!ffmpegInstance) throw new Error('FFmpeg not loaded');

        // Write input file
        const inputName = options.fileName || 'input';
        const outputName = 'output.' + options.format;

        await ffmpegInstance.writeFile(
            inputName,
            new Uint8Array(buffer)
        );

        // Build FFmpeg command based on format and quality
        const command = buildFFmpegCommand(
            inputName,
            outputName,
            options
        );

        // Execute FFmpeg
        await ffmpegInstance.exec(command);

        // Read output
        const data = await ffmpegInstance.readFile(outputName);

        // Clean up
        await ffmpegInstance.deleteFile(inputName);
        await ffmpegInstance.deleteFile(outputName);

        // Return data (Uint8Array)
        return data;
    } catch (error: any) {
        throw new Error(`Processing failed: ${error.message}`);
    }
}

// Build FFmpeg command based on options
function buildFFmpegCommand(
    input: string,
    output: string,
    options: any
): string[] {
    const cmd: string[] = ['-i', input];

    // Quality presets
    const qualitySettings = {
        high: { videoBitrate: '2M', audioBitrate: '192k', crf: '18' },
        medium: { videoBitrate: '1M', audioBitrate: '128k', crf: '23' },
        low: { videoBitrate: '500k', audioBitrate: '96k', crf: '28' },
    };

    const qualityKey = (options.quality || 'medium') as keyof typeof qualitySettings;
    const quality = qualitySettings[qualityKey];

    if (options.format === 'mp3') {
        // Audio extraction
        cmd.push('-vn'); // No video
        cmd.push('-acodec', 'libmp3lame');
        cmd.push('-ab', options.audioBitrate || quality.audioBitrate);
    } else if (options.format === 'mp4') {
        // Video conversion with H.264
        cmd.push('-c:v', 'libx264');
        cmd.push('-crf', quality.crf);
        cmd.push('-preset', 'medium');
        cmd.push('-c:a', 'aac');
        cmd.push('-b:a', options.audioBitrate || quality.audioBitrate);
        cmd.push('-movflags', '+faststart'); // Enable streaming
    } else if (options.format === 'webm') {
        // WebM format
        cmd.push('-c:v', 'libvpx-vp9');
        cmd.push('-b:v', options.videoBitrate || quality.videoBitrate);
        cmd.push('-c:a', 'libopus');
        cmd.push('-b:a', options.audioBitrate || quality.audioBitrate);
    }

    cmd.push(output);
    return cmd;
}

// Message handler
(self as any).addEventListener('message', async (e: MessageEvent) => {
    const { action, taskId, buffer, options } = e.data;

    if (action !== 'process') return;

    try {
        self.postMessage({ event: 'progress', data: { progress: 0 }, taskId });

        const result = await processMedia(buffer, options);

        let transferBuffer: ArrayBuffer;
        if (typeof result === 'string') {
            transferBuffer = new TextEncoder().encode(result).buffer as ArrayBuffer;
        } else {
            transferBuffer = result.buffer as ArrayBuffer; // Underlying ArrayBuffer
        }

        // Ensure we have a clean transferable buffer
        const finalBuffer = transferBuffer.slice(0);

        self.postMessage({
            event: 'done',
            data: { result: finalBuffer },
            taskId,
        }, [finalBuffer]);

    } catch (error: any) {
        self.postMessage({
            event: 'error',
            data: { message: error.message || 'Processing failed' },
            taskId,
        });
    }
});

export { };


