'use client';

/**
 * File Upload Hook with GCS Signed URL Flow
 * Implements the 9-step flow from the specification
 */
import { useState } from 'react';
import { generateGCSUploadURL, uploadToGCS } from './api-client';
import toast from 'react-hot-toast';

export type UploadState = 'idle' | 'validating' | 'uploading' | 'processing' | 'success' | 'error';

export interface UseFileUploadOptions {
  onSuccess?: (gcsPath: string) => void;
  onError?: (error: Error) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export interface UseFileUploadReturn {
  uploadState: UploadState;
  uploadProgress: number;
  error: string | null;
  gcsPath: string | null;
  uploadFile: (file: File) => Promise<string | null>;
  reset: () => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    onSuccess,
    onError,
    maxSizeMB = 50,
    allowedTypes = ['pdf', 'doc', 'docx', 'txt'],
  } = options;
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gcsPath, setGcsPath] = useState<string | null>(null);

  const reset = () => {
    setUploadState('idle');
    setUploadProgress(0);
    setError(null);
    setGcsPath(null);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Step 1: Validate file
      setUploadState('validating');
      setError(null);

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
      }

      // Step 2-4: Generate signed URL from BFF
      setUploadState('uploading');
      const { signed_url, gcs_path } = await generateGCSUploadURL(
        {
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
        },
        undefined
      );

      // Step 5: Upload directly to GCS with progress tracking
      await uploadToGCS(signed_url, file, (progress) => {
        setUploadProgress(Math.round(progress));
      });

      // Step 6: Upload complete
      setGcsPath(gcs_path);
      setUploadState('success');
      setUploadProgress(100);
      toast.success('File uploaded successfully');
      onSuccess?.(gcs_path);

      return gcs_path;
    } catch (err) {
      const error = err as Error;
      console.error('Upload error:', error);
      setError(error.message);
      setUploadState('error');
      toast.error(error.message || 'Upload failed');
      onError?.(error);
      return null;
    }
  };

  return {
    uploadState,
    uploadProgress,
    error,
    gcsPath,
    uploadFile,
    reset,
  };
}

/**
 * Hook for multi-file uploads (e.g., Merge PDFs)
 */
export function useMultiFileUpload(options: UseFileUploadOptions = {}) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gcsPaths, setGcsPaths] = useState<string[]>([]);

  const reset = () => {
    setUploadState('idle');
    setUploadProgress(0);
    setError(null);
    setGcsPaths([]);
  };

  const uploadFiles = async (files: File[]): Promise<string[] | null> => {
    try {
      setUploadState('uploading');
      setError(null);

      const uploadedPaths: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file) {
          throw new Error(`File at index ${i} is undefined`);
        }

        // Generate signed URL
        const { signed_url, gcs_path } = await generateGCSUploadURL(
          {
            filename: file.name,
            content_type: file.type,
            file_size: file.size,
          },
          undefined
        );

        // Upload to GCS
        await uploadToGCS(signed_url, file, (fileProgress) => {
          const overallProgress = ((i + fileProgress / 100) / totalFiles) * 100;
          setUploadProgress(Math.round(overallProgress));
        });

        uploadedPaths.push(gcs_path);
      }

      setGcsPaths(uploadedPaths);
      setUploadState('success');
      setUploadProgress(100);
      toast.success(`${totalFiles} files uploaded successfully`);

      return uploadedPaths;
    } catch (err) {
      const error = err as Error;
      console.error('Multi-upload error:', error);
      setError(error.message);
      setUploadState('error');
      toast.error(error.message || 'Upload failed');
      return null;
    }
  };

  return {
    uploadState,
    uploadProgress,
    error,
    gcsPaths,
    uploadFiles,
    reset,
  };
}
