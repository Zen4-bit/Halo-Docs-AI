'use client';

import React, { useState, useCallback } from 'react';
import { Upload, File, X, FileText, Image, Video, Music, FileSpreadsheet, Presentation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  disabled?: boolean;
  showPreview?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
  if (type.includes('image')) return <Image className="w-5 h-5" />;
  if (type.includes('video')) return <Video className="w-5 h-5" />;
  if (type.includes('audio')) return <Music className="w-5 h-5" />;
  if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-5 h-5" />;
  if (type.includes('presentation') || type.includes('powerpoint')) return <Presentation className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export default function FileDropzone({
  files,
  onFilesChange,
  accept,
  multiple = false,
  maxFiles = 50,
  maxSize = 100, // 100MB default
  title = 'Drop files here',
  description = 'or click to browse',
  icon,
  accentColor = 'amber',
  disabled = false,
  showPreview = true,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  }, [disabled, files, multiple, maxFiles, maxSize]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;
    const selectedFiles = Array.from(e.target.files);
    validateAndAddFiles(selectedFiles);
    e.target.value = ''; // Reset input
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    setError(null);
    
    // Filter by accept types
    const acceptTypes = accept.split(',').map(t => t.trim());
    const filteredFiles = newFiles.filter(file => {
      return acceptTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.includes('*')) {
          const mainType = type.split('/')[0] || '';
          return file.type.startsWith(mainType);
        }
        return file.type === type;
      });
    });

    if (filteredFiles.length < newFiles.length) {
      setError(`Some files were skipped (unsupported format)`);
    }

    // Check file size
    const oversizedFiles = filteredFiles.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed ${maxSize}MB limit`);
      return;
    }

    // Check max files
    const totalFiles = multiple ? [...files, ...filteredFiles] : filteredFiles.slice(0, 1);
    if (totalFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    onFilesChange(totalFiles.slice(0, maxFiles));
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
    setError(null);
  };

  const clearAll = () => {
    onFilesChange([]);
    setError(null);
  };

  const accentClasses = {
    amber: {
      border: 'border-amber-500/50',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      button: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30',
    },
    red: {
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      text: 'text-red-600 dark:text-red-400',
      icon: 'bg-red-500/20 text-red-600 dark:text-red-400',
      button: 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30',
    },
    blue: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      button: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30',
    },
    green: {
      border: 'border-green-500/50',
      bg: 'bg-green-500/10',
      text: 'text-green-600 dark:text-green-400',
      icon: 'bg-green-500/20 text-green-600 dark:text-green-400',
      button: 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30',
    },
    purple: {
      border: 'border-purple-500/50',
      bg: 'bg-purple-500/10',
      text: 'text-purple-600 dark:text-purple-400',
      icon: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      button: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/30',
    },
  };

  const colors = accentClasses[accentColor as keyof typeof accentClasses] || accentClasses.amber;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        className={`relative rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5' 
            : isDragOver 
              ? `${colors.border} ${colors.bg}` 
              : files.length > 0 
                ? `border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:${colors.border} hover:${colors.bg}` 
                : `border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:${colors.border} hover:${colors.bg}`
        }`}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="text-center">
          <motion.div 
            className={`inline-flex p-4 rounded-2xl ${colors.icon} mb-4`}
            animate={{ scale: isDragOver ? 1.1 : 1, rotate: isDragOver ? -5 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {icon || <Upload className="w-8 h-8" />}
          </motion.div>
          
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
            {files.length === 0 ? title : `${files.length} file${files.length !== 1 ? 's' : ''} selected`}
          </h3>
          <p className="text-sm text-slate-500 dark:text-white/50 mb-4">{description}</p>
          
          <button 
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium ${colors.button} transition-colors`}
            onClick={(e) => e.stopPropagation()}
          >
            Browse Files
          </button>
          
          <p className="text-xs text-slate-400 dark:text-white/30 mt-3">
            Max {maxSize}MB per file • {multiple ? `Up to ${maxFiles} files` : 'Single file'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-white/60">
              {files.length} file{files.length !== 1 ? 's' : ''} • {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
            </span>
            <button
              onClick={clearAll}
              className="text-sm text-slate-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  layout
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group hover:bg-slate-200 dark:hover:bg-white/8 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${colors.icon}`}>
                    {getFileIcon(file.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-white truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-white/40">{formatFileSize(file.size)}</p>
                  </div>
                  
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 rounded-lg text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 
                      opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
