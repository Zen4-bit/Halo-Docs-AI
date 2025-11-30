'use client';

import React, { useState } from 'react';
import { ImageIcon, Download, Sliders } from 'lucide-react';
import { ToolShell } from '@/components/media/ToolShell';
import { DragDropZone } from '@/components/media/DragDropZone';
import { ProgressBar } from '@/components/media/ProgressBar';
import { downloadBlob, formatBytes } from '@/lib/workerManager';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function ImageCompressorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState(80);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState(0);

    const handleFilesAccepted = (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            if (!selectedFile) return;

            setFile(selectedFile);
            setOriginalSize(selectedFile.size);
            setOutputBlob(null);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleCompress = async () => {
        if (!file) return;

        try {
            setProcessing(true);
            setProgress(0);

            const worker = new Worker(
                new URL('@/workers/image.worker.ts', import.meta.url),
                { type: 'module' }
            );

            worker.onmessage = (e) => {
                const { type, progress: prog, payload } = e.data;

                if (type === 'progress') {
                    setProgress(prog);
                } else if (type === 'complete') {
                    setOutputBlob(payload);
                    setProgress(100);
                    setProcessing(false);
                    worker.terminate();
                } else if (type === 'error') {
                    alert('Compression failed: ' + e.data.error);
                    setProcessing(false);
                    worker.terminate();
                }
            };

            worker.postMessage({
                type: 'process',
                file,
                options: {
                    type: 'compress',
                    quality,
                    format: file.type.includes('png') ? 'png' : 'jpeg',
                },
            });
        } catch (err: any) {
            alert('Compression failed: ' + err.message);
            setProcessing(false);
        }
    };

    const handleDownload = () => {
        if (outputBlob && file) {
            const extension = file.name.split('.').pop();
            const filename = file.name.replace(/\.[^/.]+$/, '') + '_compressed.' + extension;
            downloadBlob(outputBlob, filename);
        }
    };

    const compressionRatio = outputBlob
        ? ((1 - outputBlob.size / originalSize) * 100).toFixed(1)
        : 0;

    return (
        <ToolShell
            title="Image Compressor"
            description="Reduce image file size while maintaining quality"
            icon={<ImageIcon className="w-10 h-10 text-white" />}
        >
            <div className="space-y-6">
                {/* Upload Zone */}
                <DragDropZone
                    onFilesAccepted={handleFilesAccepted}
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                    multiple={false}
                    maxSize={50 * 1024 * 1024} // 50MB
                />

                {/* Preview and Settings */}
                {file && preview && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {/* Preview */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
                            <div className="relative aspect-video bg-black/20 rounded-xl overflow-hidden">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="mt-4 flex justify-between text-sm">
                                <span className="text-white/60">Original Size:</span>
                                <span className="text-white font-medium">{formatBytes(originalSize)}</span>
                            </div>
                            {outputBlob && (
                                <>
                                    <div className="mt-2 flex justify-between text-sm">
                                        <span className="text-white/60">Compressed Size:</span>
                                        <span className="text-green-400 font-medium">{formatBytes(outputBlob.size)}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between text-sm">
                                        <span className="text-white/60">Saved:</span>
                                        <span className="text-purple-400 font-medium">{compressionRatio}%</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Settings */}
                        <div className="space-y-6">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sliders className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-lg font-semibold text-white">Quality</h3>
                                </div>

                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(parseInt(e.target.value))}
                                    disabled={processing}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <div className="mt-3 flex justify-between items-center">
                                    <span className="text-sm text-white/60">Quality Level</span>
                                    <span className="text-2xl font-bold text-white">{quality}%</span>
                                </div>

                                {/* Quality Presets */}
                                <div className="mt-6 grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'Low', value: 60 },
                                        { label: 'Medium', value: 80 },
                                        { label: 'High', value: 95 },
                                    ].map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => setQuality(preset.value)}
                                            disabled={processing}
                                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${quality === preset.value
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Compress Button */}
                            {!processing && !outputBlob && (
                                <button
                                    onClick={handleCompress}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Compress Image
                                </button>
                            )}

                            {/* Download Button */}
                            {outputBlob && !processing && (
                                <button
                                    onClick={handleDownload}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Download className="w-5 h-5 inline mr-2" />
                                    Download Compressed Image
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Progress */}
                {processing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                        <ProgressBar progress={progress} status="Compressing image..." />
                    </motion.div>
                )}
            </div>
        </ToolShell>
    );
}
