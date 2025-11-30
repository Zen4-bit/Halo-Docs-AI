'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileCheck, AlertCircle, X } from 'lucide-react';
import { useActiveFile } from '@/context/ActiveFileContext';
import { validateFile, FileValidationError, formatBytes } from '@/lib/client/fileUtils';

interface UniversalUploadProps {
    accept?: string;
    maxSize?: number;
    onUploadComplete?: () => void;
    supportedFormats?: string;
}

export function UniversalUpload({ accept = '*', maxSize, onUploadComplete, supportedFormats = 'PDF files only' }: UniversalUploadProps) {
    const { setActiveFile, file: activeFile, clearActiveFile, metadata, isLoading } = useActiveFile();
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = useCallback(async (file: File) => {
        setError(null);

        try {
            validateFile(file);
            await setActiveFile(file);
            onUploadComplete?.();
        } catch (err) {
            if (err instanceof FileValidationError) {
                setError(err.message);
            } else {
                setError('Failed to process file');
            }
            console.error('File upload error:', err);
        }
    }, [setActiveFile, onUploadComplete]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && files[0]) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && files[0]) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handleClear = useCallback(() => {
        clearActiveFile();
        setError(null);
    }, [clearActiveFile]);

    if (activeFile && metadata) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 p-6"
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <FileCheck className="w-6 h-6 text-green-400" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                            {metadata.name}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                            <span>{metadata.type}</span>
                            <span>•</span>
                            <span>{formatBytes(metadata.size)}</span>
                            {metadata.width && metadata.height && (
                                <>
                                    <span>•</span>
                                    <span>{metadata.width} × {metadata.height}</span>
                                </>
                            )}
                            {metadata.duration && (
                                <>
                                    <span>•</span>
                                    <span>{Math.round(metadata.duration)}s</span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleClear}
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        aria-label="Clear file"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t border-green-500/20">
                    <p className="text-sm text-green-400 flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        <span>File loaded successfully. Select an operation from the sidebar to begin.</span>
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <motion.div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                animate={{
                    borderColor: isDragging ? 'rgb(99 102 241)' : 'rgb(71 85 105 / 0.3)',
                    backgroundColor: isDragging ? 'rgb(99 102 241 / 0.05)' : 'rgb(30 41 59 / 0.5)',
                }}
                className="relative overflow-hidden rounded-2xl border-2 border-dashed backdrop-blur-xl transition-colors"
            >
                <input
                    type="file"
                    accept={accept}
                    onChange={onFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isLoading}
                />

                <div className="p-12 text-center">
                    <motion.div
                        animate={{
                            scale: isDragging ? 1.1 : 1,
                            rotate: isDragging ? 5 : 0,
                        }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 mb-6"
                    >
                        <Upload className="w-10 h-10 text-primary" />
                    </motion.div>

                    <h3 className="text-xl font-semibold text-white mb-2">
                        {isDragging ? 'Drop your file here' : 'Upload a file'}
                    </h3>

                    <p className="text-slate-400 mb-6">
                        Drag and drop or click to browse
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
                        <span>Supports:</span>
                        <span className="px-2 py-1 rounded bg-slate-800/50">{supportedFormats}</span>
                    </div>
                </div>

                {/* Animated border gradient */}
                <AnimatePresence>
                    {isDragging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 pointer-events-none"
                        >
                            <div className="absolute inset-0 border-4 border-primary/50 rounded-2xl animate-pulse" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading State */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3"
                    >
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-primary">Processing file...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
