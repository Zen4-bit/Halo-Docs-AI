'use client';

// Generic image resize tool - can be customized for PNG/JPG/WebP
import React, { useState } from 'react';
import { Maximize2, Download } from 'lucide-react';
import { ToolShell } from '@/components/media/ToolShell';
import { DragDropZone } from '@/components/media/DragDropZone';
import { ProgressBar } from '@/components/media/ProgressBar';
import { downloadBlob, formatBytes } from '@/lib/workerManager';
import { motion } from 'framer-motion';

export default function ImageResizerPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [maintainAspect, setMaintainAspect] = useState(true);
    const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);

    const handleFilesAccepted = (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            if (!selectedFile) return;

            setFile(selectedFile);
            setOutputBlob(null);

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new window.Image();
                img.onload = () => {
                    setOriginalDimensions({ width: img.width, height: img.height });
                    setWidth(img.width);
                    setHeight(img.height);
                };
                img.src = e.target?.result as string;
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleWidthChange = (newWidth: number) => {
        setWidth(newWidth);
        if (maintainAspect && originalDimensions.width > 0) {
            const ratio = originalDimensions.height / originalDimensions.width;
            setHeight(Math.round(newWidth * ratio));
        }
    };

    const handleHeightChange = (newHeight: number) => {
        setHeight(newHeight);
        if (maintainAspect && originalDimensions.height > 0) {
            const ratio = originalDimensions.width / originalDimensions.height;
            setWidth(Math.round(newHeight * ratio));
        }
    };

    const handleResize = async () => {
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
                    alert('Resize failed: ' + e.data.error);
                    setProcessing(false);
                    worker.terminate();
                }
            };

            worker.postMessage({
                type: 'process',
                file,
                options: {
                    type: 'resize',
                    maxWidth: width,
                    maxHeight: height,
                    maintainAspectRatio: maintainAspect,
                    format: file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpeg',
                    quality: 95,
                },
            });
        } catch (err: any) {
            alert('Resize failed: ' + err.message);
            setProcessing(false);
        }
    };

    const handleDownload = () => {
        if (outputBlob && file) {
            const extension = file.name.split('.').pop();
            const filename = file.name.replace(/\.[^/.]+$/, '') + `_${width}x${height}.${extension}`;
            downloadBlob(outputBlob, filename);
        }
    };

    const sizePresets = [
        { label: 'Instagram', width: 1080, height: 1080 },
        { label: 'Facebook', width: 1200, height: 630 },
        { label: 'Twitter', width: 1200, height: 675 },
        { label: 'YouTube', width: 1280, height: 720 },
        { label: 'Full HD', width: 1920, height: 1080 },
        { label: '4K', width: 3840, height: 2160 },
    ];

    return (
        <ToolShell
            title="Image Resizer"
            description="Resize images to any dimensions"
            icon={<Maximize2 className="w-10 h-10 text-white" />}
        >
            <div className="space-y-6">
                <DragDropZone
                    onFilesAccepted={handleFilesAccepted}
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                    multiple={false}
                    maxSize={50 * 1024 * 1024}
                />

                {file && preview && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Preview */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
                            <div className="relative aspect-video bg-black/20 rounded-xl overflow-hidden">
                                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                            </div>
                            <div className="mt-4 text-sm text-white/60">
                                Original: {originalDimensions.width} × {originalDimensions.height}px
                            </div>
                        </div>

                        {/* Size Presets */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Presets</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {sizePresets.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => {
                                            setWidth(preset.width);
                                            setHeight(preset.height);
                                        }}
                                        disabled={processing}
                                        className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white transition-all"
                                    >
                                        <div>{preset.label}</div>
                                        <div className="text-xs text-white/60">{preset.width}×{preset.height}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Dimensions */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Custom Dimensions</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-white/70 mb-2">Width (px)</label>
                                    <input
                                        type="number"
                                        value={width}
                                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                                        disabled={processing}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/70 mb-2">Height (px)</label>
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                                        disabled={processing}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                        {/* Resize Button */}
                        {!processing && !outputBlob && (
                            <button
                                onClick={handleResize}
                                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Resize Image
                            </button>
                        )}

                        {/* Progress */}
                        {processing && (
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <ProgressBar progress={progress} status="Resizing image..." />
                            </div>
                        )}

                        {/* Download */}
                        {outputBlob && !processing && (
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-1">Ready to Download</h3>
                                        <p className="text-sm text-white/60">
                                            {formatBytes(outputBlob.size)} • {width} × {height}px
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Download className="w-5 h-5 inline mr-2" />
                                    Download Resized Image
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </ToolShell>
    );
}
