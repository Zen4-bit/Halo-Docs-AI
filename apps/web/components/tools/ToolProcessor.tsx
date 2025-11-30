'use client';

import { useState } from 'react';
import UploadBox from './UploadBox';
import ResultBox from './ResultBox';
import AdvancedOptions from './AdvancedOptions';
import { Loader2 } from 'lucide-react';

interface ToolProcessorProps {
  tool: any;
  apiBaseUrl?: string;
}

export default function ToolProcessor({ tool, apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080' }: ToolProcessorProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Advanced options state
  const defaultOptions: Record<string, any> = {};
  if (tool.advancedOptions) {
    Object.entries(tool.advancedOptions).forEach(([key, config]: [string, any]) => {
      defaultOptions[key] = config.default;
    });
  }
  const [options, setOptions] = useState(defaultOptions);

  const handleOptionChange = (key: string, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();

      // Add files
      if (tool.multiple) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      } else {
        if (files[0]) {
          formData.append('file', files[0]);
        }
      }

      // Add options
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${apiBaseUrl}${tool.endpoint}`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle response based on content type
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        setResult(data);
      } else {
        // File download
        const blob = await response.blob();
        const contentDisposition = response.headers.get('content-disposition');
        const fileNameMatch = contentDisposition?.match(/filename="?(.+)"?/);
        const fileName = fileNameMatch ? fileNameMatch[1] : `${tool.id}-result`;

        setResult({
          blob,
          fileName,
          fileSize: blob.size,
          url: URL.createObjectURL(blob)
        });
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'An error occurred while processing');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result?.url) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
    setOptions(defaultOptions);
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      {!result && (
        <>
          <UploadBox
            acceptedFiles={tool.acceptedFiles}
            multiple={tool.multiple}
            files={files}
            onFilesChange={setFiles}
            disabled={processing}
          />

          {/* Advanced Options */}
          {tool.advancedOptions && (
            <AdvancedOptions
              options={tool.advancedOptions}
              values={options}
              onChange={handleOptionChange}
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
              <p className="text-sm font-medium">Error: {error}</p>
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={handleProcess}
            disabled={processing || files.length === 0}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all
              ${processing || files.length === 0
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20'
              }
            `}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing... {progress}%
              </span>
            ) : (
              'Process Files'
            )}
          </button>

          {/* Progress Bar */}
          {processing && (
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </>
      )}

      {/* Result Section */}
      {result && (
        <>
          <ResultBox
            fileName={result.fileName}
            fileSize={result.fileSize}
            downloadUrl={result.url}
            onDownload={handleDownload}
            message="Processing complete!"
          />

          <button
            onClick={handleReset}
            className="w-full py-3 px-6 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            Process Another File
          </button>
        </>
      )}
    </div>
  );
}
