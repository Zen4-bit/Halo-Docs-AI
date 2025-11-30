'use client';

import React, { useState } from 'react';
import { Video, Download, Link as LinkIcon, Upload as UploadIcon } from 'lucide-react';
import { ToolShell } from '@/components/media/ToolShell';
import { DragDropZone } from '@/components/media/DragDropZone';
import { ProgressBar } from '@/components/media/ProgressBar';
import { downloadBlob, formatBytes } from '@/lib/workerManager';
import { motion } from 'framer-motion';

export default function VideoDownloaderPage() {
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');
    const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFilesAccepted = (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            if (!selectedFile) return;

            setFile(selectedFile);
            setUrl('');
            setError(null);
        }
    };

    const handleProcess = async () => {
        if (!file) {
            setError('Please upload a video file');
            return;
        }

        try {
            setProcessing(true);
            setProgress(0);
            setError(null);

            // Create worker
            const worker = new Worker(
                new URL('@/workers/ffmpeg.worker.ts', import.meta.url),
                { type: 'module' }
            );

            worker.onmessage = (e) => {
                const { type, progress: prog, payload, error: err } = e.data;

                if (type === 'progress') {
                    setProgress(prog);
                } else if (type === 'complete') {
                    setOutputBlob(payload);
                    setProgress(100);
                    setProcessing(false);
                    worker.terminate();
                } else if (type === 'error') {
                    setError(err);
                    setProcessing(false);
                    worker.terminate();
                }
            };

            worker.onerror = (err) => {
                setError('Worker error: ' + err.message);
                setProcessing(false);
                worker.terminate();
            };

            // Send task to worker
            worker.postMessage({
                type: 'process',
                file,
                options: {
                    format,
                    quality,
                },
            });
        } catch (err: any) {
            setError(err.message || 'Processing failed');
            setProcessing(false);
        }
    };

    const handleDownload = () => {
        if (outputBlob && file) {
            const filename = file.name.replace(/\.[^/.]+$/, '') + '.' + format;
            downloadBlob(outputBlob, filename);
        }
    };

    return (
        <ToolShell
            title="Video Downloader"
            description="Paste a video link and download MP4 or MP3 instantly"
            icon={<Video className="w-10 h-10 text-white" />}
            infoText="Due to browser CORS restrictions, direct URL downloads from YouTube/Vimeo require server-side processing. Upload a video file directly or provide a direct MP4/WebM URL for client-side processing."
        >
            <div className="space-y-6">
                {/* URL Input */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <label className="block text-sm font-medium text-white mb-3">
                        <LinkIcon className="w-4 h-4 inline mr-2" />
                        Video URL (Direct link to MP4/WebM file)
                    </label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            setFile(null);
                        }}
                        placeholder="https://example.com/video.mp4"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <p className="mt-2 text-xs text-white/50">
                        Note: Must be a direct video file URL, not a page URL
                    </p>
                </div>

                {/* OR Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-slate-900 text-white/60">OR</span>
                    </div>
                </div>

                {/* File Upload */}
                <DragDropZone
                    onFilesAccepted={handleFilesAccepted}
                    accept={{ 'video/*': ['.mp4', '.webm', '.avi', '.mov', '.mkv'] }}
                    multiple={false}
                    maxSize={500 * 1024 * 1024} // 500MB
                />

                {/* Settings */}
                {file && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {/* Format Selection */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <label className="block text-sm font-medium text-white mb-3">
                                Output Format
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['mp4', 'mp3'] as const).map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setFormat(fmt)}
                                        className={`px-4 py-3 rounded-xl font-medium transition-all ${format === fmt
                                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                            }`}
                                    >
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quality Selection */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <label className="block text-sm font-medium text-white mb-3">
                                Quality
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['low', 'medium', 'high'] as const).map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setQuality(q)}
                                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${quality === q
                                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                            }`}
                                    >
                                        {q.charAt(0).toUpperCase() + q.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Process Button */}
                {file && !processing && !outputBlob && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleProcess}
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <UploadIcon className="w-5 h-5 inline mr-2" />
                        Process Video
                    </motion.button>
                )}

                {/* Progress */}
                {processing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                        <ProgressBar
                            progress={progress}
                            status={`Processing ${format.toUpperCase()}...`}
                        />
                    </motion.div>
                )}

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6"
                    >
                        <p className="text-red-400 text-sm">{error}</p>
                    </motion.div>
                )}

                {/* Download */}
                {outputBlob && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    Ready to Download
                                </h3>
                                <p className="text-sm text-white/60">
                                    {formatBytes(outputBlob.size)} • {format.toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDownload}
                            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Download className="w-5 h-5 inline mr-2" />
                            Download {format.toUpperCase()}
                        </button>
                    </motion.div>
                )}
            </div>
        </ToolShell>
    );
}
