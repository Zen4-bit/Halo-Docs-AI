'use client';

import React, { useState } from 'react';
import { Grid3x3, Download, X, Check } from 'lucide-react';
import { ToolShell } from '@/components/media/ToolShell';
import { DragDropZone } from '@/components/media/DragDropZone';
import { ProgressBar } from '@/components/media/ProgressBar';
import { downloadBlob, formatBytes } from '@/lib/workerManager';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';

interface FileTask {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'complete' | 'error';
    progress: number;
    outputBlob?: Blob;
    error?: string;
}

export default function BulkResizePage() {
    const [files, setFiles] = useState<FileTask[]>([]);
    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [maintainAspect, setMaintainAspect] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [format, setFormat] = useState<'original' | 'jpeg' | 'png' | 'webp'>('original');

    const handleFilesAccepted = (acceptedFiles: File[]) => {
        const newTasks: FileTask[] = acceptedFiles.map((file) => ({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            status: 'pending',
            progress: 0,
        }));
        setFiles((prev) => [...prev, ...newTasks]);
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const processFile = async (task: FileTask): Promise<void> => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(
                new URL('@/workers/image.worker.ts', import.meta.url),
                { type: 'module' }
            );

            worker.onmessage = (e) => {
                const { type, progress, payload, error } = e.data;

                if (type === 'progress') {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === task.id ? { ...f, progress } : f
                        )
                    );
                } else if (type === 'complete') {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === task.id
                                ? { ...f, status: 'complete', progress: 100, outputBlob: payload }
                                : f
                        )
                    );
                    worker.terminate();
                    resolve();
                } else if (type === 'error') {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === task.id
                                ? { ...f, status: 'error', error }
                                : f
                        )
                    );
                    worker.terminate();
                    reject(new Error(error));
                }
            };

            worker.onerror = (err) => {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === task.id
                            ? { ...f, status: 'error', error: err.message }
                            : f
                    )
                );
                worker.terminate();
                reject(err);
            };

            // Determine format
            let outputFormat = format;
            if (format === 'original') {
                if (task.file.type.includes('png')) outputFormat = 'png';
                else if (task.file.type.includes('webp')) outputFormat = 'webp';
                else outputFormat = 'jpeg';
            }

            worker.postMessage({
                type: 'process',
                file: task.file,
                options: {
                    type: 'resize',
                    maxWidth: width,
                    maxHeight: height,
                    maintainAspectRatio: maintainAspect,
                    format: outputFormat,
                    quality: 95,
                },
            });
        });
    };

    const handleProcessAll = async () => {
        setProcessing(true);

        // Update all to processing
        setFiles((prev) =>
            prev.map((f) => ({ ...f, status: 'processing' as const, progress: 0 }))
        );

        // Process with concurrency limit
        const concurrency = navigator.hardwareConcurrency || 4;
        const queue = [...files];
        const active: Promise<void>[] = [];

        while (queue.length > 0 || active.length > 0) {
            while (active.length < concurrency && queue.length > 0) {
                const task = queue.shift()!;
                const promise = processFile(task)
                    .catch((err) => console.error('Task failed:', err))
                    .then(() => {
                        const index = active.indexOf(promise);
                        if (index > -1) active.splice(index, 1);
                    });
                active.push(promise);
            }

            if (active.length > 0) {
                await Promise.race(active);
            }
        }

        setProcessing(false);
    };

    const handleDownloadAll = async () => {
        const completedFiles = files.filter((f) => f.status === 'complete' && f.outputBlob);

        if (completedFiles.length === 0) return;

        const zip = new JSZip();

        completedFiles.forEach((task) => {
            if (task.outputBlob) {
                const ext = format === 'original'
                    ? task.file.name.split('.').pop()
                    : format === 'jpeg'
                        ? 'jpg'
                        : format;
                const filename = task.file.name.replace(/\.[^/.]+$/, '') + `_${width}x${height}.${ext}`;
                zip.file(filename, task.outputBlob);
            }
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, `resized_images_${Date.now()}.zip`, 'application/zip');
    };

    const completedCount = files.filter((f) => f.status === 'complete').length;
    const errorCount = files.filter((f) => f.status === 'error').length;

    return (
        <ToolShell
            title="Bulk Resize"
            description="Resize multiple images at once"
            icon={<Grid3x3 className="w-10 h-10 text-white" />}
        >
            <div className="space-y-6">
                <DragDropZone
                    onFilesAccepted={handleFilesAccepted}
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                    multiple={true}
                    maxSize={50 * 1024 * 1024}
                />

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Dimensions</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-white/70 mb-2">Width</label>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                                    disabled={processing}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/70 mb-2">Height</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                                    disabled={processing}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-white/80">
                            <input
                                type="checkbox"
                                checked={maintainAspect}
                                onChange={(e) => setMaintainAspect(e.target.checked)}
                                disabled={processing}
                                className="w-5 h-5 rounded accent-purple-500"
                            />
                            <span className="text-sm">Maintain aspect ratio</span>
                        </label>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Output Format</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {(['original', 'jpeg', 'png', 'webp'] as const).map((fmt) => (
                                <button
                                    key={fmt}
                                    onClick={() => setFormat(fmt)}
                                    disabled={processing}
                                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${format === fmt
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                        }`}
                                >
                                    {fmt === 'original' ? 'Keep Original' : fmt.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">
                                Files ({files.length})
                            </h3>
                            {completedCount > 0 && (
                                <div className="text-sm text-green-400">
                                    {completedCount} completed {errorCount > 0 && `• ${errorCount} failed`}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            <AnimatePresence>
                                {files.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl"
                                    >
                                        {/* Status Icon */}
                                        <div className="flex-shrink-0">
                                            {task.status === 'complete' && (
                                                <Check className="w-5 h-5 text-green-400" />
                                            )}
                                            {task.status === 'error' && (
                                                <X className="w-5 h-5 text-red-400" />
                                            )}
                                            {task.status === 'processing' && (
                                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                            )}
                                            {task.status === 'pending' && (
                                                <div className="w-5 h-5 border-2 border-white/20 rounded-full" />
                                            )}
                                        </div>

                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{task.file.name}</p>
                                            <p className="text-xs text-white/50">{formatBytes(task.file.size)}</p>
                                            {task.status === 'processing' && (
                                                <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 transition-all"
                                                        style={{ width: `${task.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Remove Button */}
                                        {!processing && (
                                            <button
                                                onClick={() => removeFile(task.id)}
                                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4 text-white/60" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {files.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!processing && completedCount === 0 && (
                            <button
                                onClick={handleProcessAll}
                                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Process All ({files.length} images)
                            </button>
                        )}

                        {completedCount > 0 && !processing && (
                            <button
                                onClick={handleDownloadAll}
                                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Download className="w-5 h-5 inline mr-2" />
                                Download All as ZIP
                            </button>
                        )}
                    </div>
                )}
            </div>
        </ToolShell>
    );
}
