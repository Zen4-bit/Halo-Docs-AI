'use client';

import { useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import clsx from 'clsx';

interface UploadBoxProps {
  acceptedFiles: string;
  multiple: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export default function UploadBox({
  acceptedFiles,
  multiple,
  files,
  onFilesChange,
  disabled = false
}: UploadBoxProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (multiple) {
        onFilesChange([...files, ...droppedFiles]);
      } else {
        onFilesChange(droppedFiles.slice(0, 1));
      }
    },
    [files, multiple, onFilesChange, disabled]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;

    const selectedFiles = Array.from(e.target.files);
    if (multiple) {
      onFilesChange([...files, ...selectedFiles]);
    } else {
      onFilesChange(selectedFiles.slice(0, 1));
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={clsx(
          "relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 text-center group",
          disabled
            ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/5'
            : 'cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 border-white/10 bg-white/5',
          files.length > 0 && !disabled && 'border-brand-500/30 bg-brand-500/5'
        )}
      >
        <input
          type="file"
          accept={acceptedFiles}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="file-upload"
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div className={clsx(
            "p-5 rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
            files.length > 0 ? "bg-brand-500/20 text-brand-300" : "bg-white/10 text-white/60"
          )}>
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">
              {files.length === 0 ? 'Drop files here' : `${files.length} file${files.length > 1 ? 's' : ''} selected`}
            </h3>
            <p className="text-sm text-white/40">
              {multiple ? 'Or click to browse multiple files' : 'Or click to browse'}
            </p>
            <p className="text-xs text-white/30 pt-2">
              Supports: {acceptedFiles || 'All formats'}
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="p-2.5 rounded-lg bg-brand-500/20 text-brand-300">
                <File className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-white/40">{formatFileSize(file.size)}</p>
              </div>

              <button
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
