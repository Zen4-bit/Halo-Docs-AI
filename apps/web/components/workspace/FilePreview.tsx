'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useActiveFile } from '@/context/ActiveFileContext';
import { formatBytes, formatResolution, formatDuration } from '@/lib/client/fileUtils';
import { Image as ImageIcon, Video, File, ZoomIn, ZoomOut } from 'lucide-react';

export function FilePreview() {
    const { file, objectURL, metadata } = useActiveFile();
    const [zoom, setZoom] = useState(100);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        setIsImageLoaded(false);
        setZoom(100);
    }, [objectURL]);

    if (!file || !objectURL || !metadata) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                        <File className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-500">No file uploaded</p>
                </div>
            </div>
        );
    }

    const isImage = metadata.type.startsWith('image/');
    const isVideo = metadata.type.startsWith('video/');
    const isAudio = metadata.type.startsWith('audio/');

    return (
        <div className="h-full flex flex-col">
            {/* Preview Header */}
            <div className="flex-shrink-0 p-4 border-b border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                            {isImage && <ImageIcon className="w-5 h-5 text-primary" />}
                            {isVideo && <Video className="w-5 h-5 text-primary" />}
                            {!isImage && !isVideo && <File className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                                {metadata.name}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {formatBytes(metadata.size)}
                            </p>
                        </div>
                    </div>

                    {isImage && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setZoom(Math.max(50, zoom - 10))}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                                aria-label="Zoom out"
                            >
                                <ZoomOut className="w-4 h-4 text-slate-400" />
                            </button>
                            <span className="text-sm text-slate-400 w-12 text-center">
                                {zoom}%
                            </span>
                            <button
                                onClick={() => setZoom(Math.min(200, zoom + 10))}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                                aria-label="Zoom in"
                            >
                                <ZoomIn className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-slate-900/50 p-4">
                <div className="h-full flex items-center justify-center">
                    {isImage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: isImageLoaded ? 1 : 0.5, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            style={{ transform: `scale(${zoom / 100})` }}
                            className="relative"
                        >
                            <img
                                src={objectURL}
                                alt={metadata.name}
                                onLoad={() => setIsImageLoaded(true)}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                            {!isImageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {isVideo && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-4xl"
                        >
                            <video
                                src={objectURL}
                                controls
                                className="w-full rounded-lg shadow-2xl bg-black"
                            >
                                Your browser does not support video playback.
                            </video>
                        </motion.div>
                    )}

                    {isAudio && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-2xl"
                        >
                            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">{metadata.name}</h4>
                                        {metadata.duration && (
                                            <p className="text-sm text-slate-400">
                                                Duration: {formatDuration(metadata.duration)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <audio
                                    src={objectURL}
                                    controls
                                    className="w-full"
                                >
                                    Your browser does not support audio playback.
                                </audio>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Metadata Footer */}
            <div className="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-800/30">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div>
                        <span className="text-slate-500">Type:</span>{' '}
                        <span className="text-white">{metadata.type}</span>
                    </div>
                    {metadata.width && metadata.height && (
                        <div>
                            <span className="text-slate-500">Resolution:</span>{' '}
                            <span className="text-white">{formatResolution(metadata.width, metadata.height)}</span>
                        </div>
                    )}
                    {metadata.duration && (
                        <div>
                            <span className="text-slate-500">Duration:</span>{' '}
                            <span className="text-white">{formatDuration(metadata.duration)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
