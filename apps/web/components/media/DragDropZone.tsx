'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DragDropZoneProps {
    onFilesAccepted: (files: File[]) => void;
    accept?: Record<string, string[]>;
    multiple?: boolean;
    maxSize?: number;
    disabled?: boolean;
    className?: string;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
    onFilesAccepted,
    accept = { 'image/*': [], 'video/*': [] },
    multiple = false,
    maxSize = 100 * 1024 * 1024, // 100MB default
    disabled = false,
    className = '',
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: any[]) => {
            setError(null);

            if (rejectedFiles.length > 0) {
                const rejection = rejectedFiles[0];
                if (rejection.errors[0]?.code === 'file-too-large') {
                    setError(`File is too large. Max size: ${maxSize / 1024 / 1024}MB`);
                } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                    setError('Invalid file type. Please upload a supported format.');
                } else {
                    setError('File upload failed. Please try again.');
                }
                return;
            }

            setFiles(acceptedFiles);
            onFilesAccepted(acceptedFiles);
        },
        [onFilesAccepted, maxSize]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        multiple,
        maxSize,
        disabled,
    });

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        onFilesAccepted(newFiles);
    };

    return (
        <div className={className}>
            <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${isDragActive
                        ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                        : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input {...getInputProps()} />

                <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: isDragActive ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <Upload
                        className={`w-16 h-16 mx-auto mb-4 transition-colors ${isDragActive ? 'text-purple-400' : 'text-white/40'
                            }`}
                    />
                </motion.div>

                <h3 className="text-xl font-semibold text-white mb-2">
                    {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </h3>
                <p className="text-white/60 mb-4">
                    or click to browse from your device
                </p>
                <p className="text-sm text-white/40">
                    Max file size: {maxSize / 1024 / 1024}MB
                </p>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 flex items-center gap-2 justify-center text-red-400"
                        >
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-2"
                    >
                        {files.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl"
                            >
                                <File className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-white/50">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
