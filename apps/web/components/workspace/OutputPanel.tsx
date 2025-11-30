'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { formatBytes, calculateCompressionRatio } from '@/lib/client/fileUtils';

interface OutputPanelProps {
    status: 'idle' | 'processing' | 'success' | 'error';
    progress?: number;
    outputBlob?: Blob;
    outputFilename?: string;
    originalSize?: number;
    onDownload?: () => void;
    errorMessage?: string;
}

export function OutputPanel({
    status,
    progress = 0,
    outputBlob,
    outputFilename,
    originalSize,
    onDownload,
    errorMessage,
}: OutputPanelProps) {
    const compressionRatio = originalSize && outputBlob
        ? calculateCompressionRatio(originalSize, outputBlob.size)
        : null;

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">Output</h2>

            <AnimatePresence mode="wait">
                {/* Idle State */}
                {status === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-center"
                    >
                        <div className="text-center text-slate-500">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                                <Download className="w-8 h-8" />
                            </div>
                            <p>Results will appear here</p>
                        </div>
                    </motion.div>
                )}

                {/* Processing State */}
                {status === 'processing' && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-center"
                    >
                        <div className="w-full max-w-md">
                            <div className="flex items-center justify-center mb-6">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white font-medium">Processing...</span>
                                    <span className="text-primary font-semibold">{progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full bg-gradient-to-r from-primary to-purple-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Success State */}
                {status === 'success' && outputBlob && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1"
                    >
                        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Processing Complete</h3>
                                    <p className="text-sm text-green-400">Your file is ready</p>
                                </div>
                            </div>

                            {/* File Stats */}
                            <div className="space-y-2 mb-4 p-4 rounded-lg bg-slate-900/50">
                                {outputFilename && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Filename:</span>
                                        <span className="text-white font-medium truncate ml-2">
                                            {outputFilename}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Size:</span>
                                    <span className="text-white font-medium">
                                        {formatBytes(outputBlob.size)}
                                    </span>
                                </div>
                                {compressionRatio !== null && compressionRatio > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Saved:</span>
                                        <span className="text-green-400 font-semibold">
                                            {compressionRatio}% smaller
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Download Button */}
                            <button
                                onClick={onDownload}
                                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                            >
                                <Download className="w-5 h-5" />
                                <span>Download File</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-center"
                    >
                        <div className="w-full max-w-md p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Processing Failed</h3>
                                    <p className="text-sm text-red-400">
                                        {errorMessage || 'An error occurred during processing'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
