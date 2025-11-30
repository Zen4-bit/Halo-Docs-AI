'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onFilesSelect: (files: File[]) => void;
  maxFiles?: number;
  accept?: string[];
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onFilesSelect,
  maxFiles = 1,
  accept = ['image/*'],
  className,
  disabled = false,
}: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = maxFiles === 1 ? acceptedFiles.slice(0, 1) : acceptedFiles;
      setFiles(newFiles);
      onFilesSelect(newFiles);
    },
    [onFilesSelect, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles,
    disabled,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelect(newFiles);
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          'hover:border-gray-400 hover:bg-gray-800/50',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          isDragActive && 'border-blue-500 bg-blue-500/10',
          disabled && 'opacity-50 cursor-not-allowed',
          'border-gray-600 bg-gray-900/20'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          {isDragActive ? (
            <>
              <Upload className="h-12 w-12 text-blue-500" />
              <p className="text-lg font-medium text-blue-400">
                Drop the images here...
              </p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-300">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  {maxFiles === 1 ? 'Single image' : `Up to ${maxFiles} images`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-300">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-300 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
