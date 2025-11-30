/**
 * S3 Upload Utility
 * Handles direct-to-S3 file uploads using presigned URLs
 */

import { generateUploadURL, completeUpload } from './api-client';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  documentId: string;
  s3Key: string;
  filename: string;
}

/**
 * Upload file directly to S3 using presigned URL
 */
export async function uploadFileToS3(
  file: File,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Step 1: Generate presigned URL
  const { upload_url, fields, s3_key, document_id } = await generateUploadURL(
    file.name,
    file.type,
    file.size,
    token
  );

  // Step 2: Upload directly to S3
  const formData = new FormData();
  
  // Add all fields from presigned URL
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value as string);
  });
  
  // Add the file last
  formData.append('file', file);

  // Upload with progress tracking
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('S3 upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('S3 upload aborted'));
    });

    xhr.open('POST', upload_url);
    xhr.send(formData);
  });

  // Step 3: Notify backend that upload is complete
  await completeUpload(document_id, s3_key, file.name, file.size, file.type, token);

  return {
    documentId: document_id,
    s3Key: s3_key,
    filename: file.name,
  };
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
