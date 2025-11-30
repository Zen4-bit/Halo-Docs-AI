/**
 * HALO Platform - File Validation Utilities
 * Strict MIME type validation using magic numbers (file header verification)
 * 
 * Security: Prevents malicious files from bypassing extension-based checks
 */

import { MIME_MAGIC_NUMBERS, type FileValidationResult } from '@/types/tool-options';

/**
 * Read file header bytes for magic number verification
 */
async function readFileHeader(file: File, bytesToRead: number = 8): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const blob = file.slice(0, bytesToRead);

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(new Uint8Array(e.target.result as ArrayBuffer));
      } else {
        reject(new Error('Failed to read file header'));
      }
    };

    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Check if file header matches magic numbers
 */
function matchesMagicNumbers(header: Uint8Array, magicNumbers: number[]): boolean {
  if (header.length < magicNumbers.length) return false;

  for (let i = 0; i < magicNumbers.length; i++) {
    if (header[i] !== magicNumbers[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Detect actual MIME type from file content using magic numbers
 */
export async function detectMimeType(file: File): Promise<string | null> {
  try {
    const header = await readFileHeader(file, 12); // Read first 12 bytes

    // Check against known magic numbers
    for (const [mimeType, magicNumbers] of Object.entries(MIME_MAGIC_NUMBERS)) {
      if (matchesMagicNumbers(header, magicNumbers)) {
        return mimeType;
      }
    }

    // Special case for WebP (check for WEBP in RIFF header)
    if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
      if (header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
        return 'image/webp';
      }
    }

    return null;
  } catch (error) {
    console.error('Error detecting MIME type:', error);
    return null;
  }
}

/**
 * Validate file against accepted MIME types with magic number checking
 */
export async function validateFile(
  file: File,
  acceptedMimeTypes: string[],
  maxSizeBytes: number = 50 * 1024 * 1024 // Default 50MB
): Promise<FileValidationResult> {
  // Check file size
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty',
      fileSize: 0,
    };
  }

  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      fileSize: file.size,
    };
  }

  // Detect actual MIME type from file content
  const detectedMimeType = await detectMimeType(file);

  if (!detectedMimeType) {
    return {
      isValid: false,
      error: 'Could not detect file type. The file may be corrupted or unsupported.',
      fileSize: file.size,
    };
  }

  // Check if detected MIME type matches accepted types
  const isAccepted = acceptedMimeTypes.some(acceptedType => {
    // Handle wildcards like "image/*"
    if (acceptedType.endsWith('/*')) {
      const category = acceptedType.split('/')[0];
      return detectedMimeType.startsWith(`${category}/`);
    }
    return acceptedType === detectedMimeType;
  });

  if (!isAccepted) {
    // Check if extension matches but content doesn't (spoofing attempt)
    if (file.type && acceptedMimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File appears to be ${detectedMimeType} but has wrong extension. Possible file type spoofing detected.`,
        detectedMimeType,
        fileSize: file.size,
      };
    }

    return {
      isValid: false,
      error: `Invalid file type. Expected one of: ${acceptedMimeTypes.join(', ')}. Detected: ${detectedMimeType}`,
      detectedMimeType,
      fileSize: file.size,
    };
  }

  return {
    isValid: true,
    detectedMimeType,
    fileSize: file.size,
  };
}

/**
 * Validate PDF file specifically
 */
export async function validatePdfFile(file: File): Promise<FileValidationResult> {
  return validateFile(file, ['application/pdf'], 50 * 1024 * 1024);
}

/**
 * Validate image file
 */
export async function validateImageFile(
  file: File,
  formats: ('png' | 'jpeg' | 'gif' | 'webp')[] = ['png', 'jpeg', 'gif', 'webp']
): Promise<FileValidationResult> {
  const mimeTypes = formats.map(format => {
    switch (format) {
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
    }
  });

  return validateFile(file, mimeTypes, 20 * 1024 * 1024); // 20MB for images
}

/**
 * Validate video file
 */
export async function validateVideoFile(file: File): Promise<FileValidationResult> {
  return validateFile(
    file,
    ['video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg'],
    200 * 1024 * 1024 // 200MB for videos
  );
}

/**
 * Validate Office document file
 */
export async function validateOfficeFile(file: File): Promise<FileValidationResult> {
  // Office files are ZIP-based (DOCX, XLSX, PPTX)
  return validateFile(
    file,
    ['application/zip', 'application/vnd.openxmlformats-officedocument'],
    50 * 1024 * 1024
  );
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  const lastPart = parts[parts.length - 1];
  return parts.length > 1 && lastPart ? lastPart.toLowerCase() : '';
}

/**
 * Check if file extension matches MIME type
 */
export function extensionMatchesMimeType(filename: string, mimeType: string): boolean {
  const extension = getFileExtension(filename);

  const mimeToExtension: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/png': ['png'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'video/mp4': ['mp4'],
    'video/webm': ['webm'],
    'application/zip': ['zip', 'docx', 'xlsx', 'pptx'],
  };

  const validExtensions = mimeToExtension[mimeType];
  return validExtensions ? validExtensions.includes(extension) : false;
}

/**
 * Batch validate multiple files
 */
export async function validateFiles(
  files: File[],
  acceptedMimeTypes: string[],
  maxSizeBytes?: number
): Promise<{
  valid: File[];
  invalid: Array<{ file: File; error: string }>;
}> {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  for (const file of files) {
    const result = await validateFile(file, acceptedMimeTypes, maxSizeBytes);
    if (result.isValid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: result.error || 'Validation failed' });
    }
  }

  return { valid, invalid };
}
