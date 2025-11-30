// File validation and utility functions

export const MAX_FILE_SIZES = {
    image: 50 * 1024 * 1024,   // 50MB
    video: 500 * 1024 * 1024,  // 500MB
    audio: 100 * 1024 * 1024,  // 100MB
    pdf: 100 * 1024 * 1024,    // 100MB
    document: 50 * 1024 * 1024, // 50MB
} as const;

export const ACCEPTED_FILE_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    pdf: ['application/pdf'],
    document: [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
} as const;

export class FileValidationError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'FileValidationError';
    }
}

export class FileTooLargeError extends FileValidationError {
    constructor(size: number, maxSize: number) {
        super(
            `File size (${formatBytes(size)}) exceeds maximum allowed size (${formatBytes(maxSize)})`,
            'FILE_TOO_LARGE'
        );
    }
}

export class InvalidFileTypeError extends FileValidationError {
    constructor(type: string, acceptedTypes: string[] | readonly string[]) {
        super(
            `File type "${type}" is not accepted. Accepted types: ${acceptedTypes.join(', ')}`,
            'INVALID_FILE_TYPE'
        );
    }
}

export class InsufficientMemoryError extends FileValidationError {
    constructor() {
        super(
            'Not enough memory available to process this file. Try closing other tabs or using a smaller file.',
            'INSUFFICIENT_MEMORY'
        );
    }
}

export type FileCategory = keyof typeof MAX_FILE_SIZES;

export function getFileCategory(file: File): FileCategory | null {
    const type = file.type.toLowerCase();

    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type === 'application/pdf') return 'pdf';
    if ((ACCEPTED_FILE_TYPES.document as readonly string[]).includes(type)) return 'document';

    return null;
}

export function validateFile(file: File, expectedCategory?: FileCategory): void {
    const category = getFileCategory(file);

    if (!category) {
        throw new InvalidFileTypeError(file.type, Object.values(ACCEPTED_FILE_TYPES).flat());
    }

    if (expectedCategory && category !== expectedCategory) {
        throw new InvalidFileTypeError(file.type, ACCEPTED_FILE_TYPES[expectedCategory]);
    }

    const maxSize = MAX_FILE_SIZES[category];
    if (file.size > maxSize) {
        throw new FileTooLargeError(file.size, maxSize);
    }
}

export async function checkMemoryAvailability(requiredBytes: number): Promise<void> {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
        // Memory API not available, skip check
        return;
    }

    const memInfo = (performance as any).memory;
    if (!memInfo) return;

    const { jsHeapSizeLimit, usedJSHeapSize } = memInfo;
    const available = jsHeapSizeLimit - usedJSHeapSize;
    const required = requiredBytes * 3; // Account for processing overhead

    if (available < required) {
        throw new InsufficientMemoryError();
    }
}

export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function changeFileExtension(filename: string, newExtension: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
        parts.pop();
    }
    return `${parts.join('.')}.${newExtension}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up object URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

export async function blobToFile(blob: Blob, filename: string): Promise<File> {
    return new File([blob], filename, { type: blob.type });
}

export function getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        mp4: 'video/mp4',
        webm: 'video/webm',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        pdf: 'application/pdf',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

export function formatResolution(width?: number, height?: number): string {
    if (!width || !height) return 'Unknown';
    return `${width} × ${height}`;
}
