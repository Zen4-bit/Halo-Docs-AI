'use client';

/**
 * Tool Processing Hook
 * Handles the complete flow: upload -> process -> download
 */
import { useState } from 'react';
import { buildApiUrl } from './api-base';
import toast from 'react-hot-toast';

export type ProcessingState = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface UseToolProcessingOptions {
  toolEndpoint: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  requestBase?: 'bff' | 'backend';
}

export interface UseToolProcessingReturn {
  state: ProcessingState;
  progress: number;
  result: any;
  error: string | null;
  processWithGCS: (gcsPath: string, additionalData?: any) => Promise<any>;
  processWithJSON: (data: any) => Promise<any>;
  reset: () => void;
}

export function useToolProcessing(options: UseToolProcessingOptions): UseToolProcessingReturn {
  const {
    toolEndpoint,
    onSuccess,
    onError,
    requestBase = 'bff',
  } = options;
  
  const [state, setState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const normalisedEndpoint = toolEndpoint.startsWith('/') ? toolEndpoint : `/${toolEndpoint}`;
  const buildTargetUrl = () => {
    if (requestBase === 'backend') {
      return buildApiUrl(normalisedEndpoint);
    }
    return `/api${normalisedEndpoint}`;
  };

  const reset = () => {
    setState('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  };

  const parseResponseBody = async (response: Response): Promise<any> => {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
      }
    }

    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  };

  const extractErrorMessage = (payload: any): string => {
    if (!payload) return 'Processing failed';
    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      if (!trimmed) return 'Processing failed';
      return trimmed.startsWith('<') ? 'Unexpected HTML response from server' : trimmed;
    }

    const candidates = [
      payload.error,
      payload.detail,
      payload.message,
      payload.reason,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (!trimmed) continue;
        return trimmed.startsWith('<') ? 'Unexpected HTML response from server' : trimmed;
      }
    }

    return 'Processing failed';
  };

  /**
   * Process a file that's already uploaded to GCS
   * This is Step 7-9 of the GCS flow
   */
  const processWithGCS = async (gcsPath: string, additionalData: any = {}): Promise<any> => {
    try {
      setState('processing');
      setError(null);
      setProgress(0);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(buildTargetUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          gcs_path: gcsPath,
          ...additionalData,
        }),
      });

      const payload = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(extractErrorMessage(payload));
      }

      const data = typeof payload === 'string' ? { result: payload } : payload;
      
      setResult(data);
      setState('success');
      setProgress(100);
      toast.success('Processing complete');
      onSuccess?.(data);

      return data;
    } catch (err) {
      const error = err as Error;
      console.error('Processing error:', error);
      setError(error.message);
      setState('error');
      toast.error(error.message || 'Processing failed');
      onError?.(error);
      return null;
    }
  };

  /**
   * Process with direct JSON data (no file upload)
   * This is the "Direct JSON Flow" from the specification
   */
  const processWithJSON = async (data: any): Promise<any> => {
    try {
      setState('processing');
      setError(null);
      setProgress(0);

      const response = await fetch(buildTargetUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const payload = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(extractErrorMessage(payload));
      }

      const responseData = typeof payload === 'string' ? { result: payload } : payload;
      
      setResult(responseData);
      setState('success');
      setProgress(100);
      toast.success('Processing complete');
      onSuccess?.(responseData);

      return responseData;
    } catch (err) {
      const error = err as Error;
      console.error('Processing error:', error);
      setError(error.message);
      setState('error');
      toast.error(error.message || 'Processing failed');
      onError?.(error);
      return null;
    }
  };

  return {
    state,
    progress,
    result,
    error,
    processWithGCS,
    processWithJSON,
    reset,
  };
}
