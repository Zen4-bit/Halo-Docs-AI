'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
    Video,
    Image as ImageIcon,
    FileImage,
    Ratio,
    Crop,
    Scissors,
    FileType,
    Maximize2,
    Grid3x3,
    Images,
    LucideIcon,
} from 'lucide-react';

interface MediaTool {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    badge: string;
    gradient: string;
    href: string;
}

const mediaTools: MediaTool[] = [
    {
        id: 'video-downloader',
        title: 'Video Downloader',
        description: 'Paste a video link and download MP4 or MP3 instantly',
        icon: Video,
        badge: 'MEDIA',
        gradient: 'from-blue-500 to-blue-600',
        href: '/media-conversion/video-downloader',
    },
    {
        id: 'image-compressor',
        title: 'Image Compressor',
        description: 'Reduce image file size while maintaining quality',
        icon: ImageIcon,
        badge: 'MEDIA',
        gradient: 'from-green-500 to-emerald-600',
        href: '/media-conversion/image-compressor',
    },
    {
        id: 'compress-jpeg',
        title: 'Compress JPEG',
        description: 'Optimize JPEG images with advanced compression',
        icon: FileImage,
        badge: 'MEDIA',
        gradient: 'from-blue-500 to-cyan-600',
        href: '/media-conversion/compress-jpeg',
    },
    {
        id: 'png-compressor',
        title: 'PNG Compressor',
        description: 'Compress PNG images without losing transparency',
        icon: FileType,
        badge: 'MEDIA',
        gradient: 'from-purple-500 to-pink-600',
        href: '/media-conversion/png-compressor',
    },
    {
        id: 'gif-compressor',
        title: 'GIF Compressor',
        description: 'Reduce GIF size while preserving animation',
        icon: FileImage,
        badge: 'MEDIA',
        gradient: 'from-orange-500 to-red-600',
        href: '/media-conversion/gif-compressor',
    },
    {
        id: 'crop-image',
        title: 'Crop Image',
        description: 'Crop and resize images to perfect dimensions',
        icon: Crop,
        badge: 'MEDIA',
        gradient: 'from-amber-500 to-orange-600',
        href: '/media-conversion/crop-image',
    },
    {
        id: 'crop-png',
        title: 'Crop PNG',
        description: 'Precisely crop PNG images with transparency support',
        icon: Scissors,
        badge: 'MEDIA',
        gradient: 'from-cyan-500 to-blue-600',
        href: '/media-conversion/crop-png',
    },
    {
        id: 'crop-webp',
        title: 'Crop WebP',
        description: 'Crop modern WebP images efficiently',
        icon: Scissors,
        badge: 'MEDIA',
        gradient: 'from-indigo-500 to-purple-600',
        href: '/media-conversion/crop-webp',
    },
    {
        id: 'crop-jpg',
        title: 'Crop JPG',
        description: 'Crop JPEG images with quality preservation',
        icon: Scissors,
        badge: 'MEDIA',
        gradient: 'from-pink-500 to-rose-600',
        href: '/media-conversion/crop-jpg',
    },
    {
        id: 'image-resizer',
        title: 'Image Resizer',
        description: 'Resize images to any dimensions',
        icon: Maximize2,
        badge: 'MEDIA',
        gradient: 'from-violet-500 to-purple-600',
        href: '/media-conversion/image-resizer',
    },
    {
        id: 'bulk-resize',
        title: 'Bulk Resize',
        description: 'Resize multiple images at once',
        icon: Grid3x3,
        badge: 'MEDIA',
        gradient: 'from-fuchsia-500 to-pink-600',
        href: '/media-conversion/bulk-resize',
    },
    {
        id: 'resize-png',
        title: 'Resize PNG',
        description: 'Resize PNG images with transparency intact',
        icon: Images,
        badge: 'MEDIA',
        gradient: 'from-teal-500 to-cyan-600',
        href: '/media-conversion/resize-png',
    },
    {
        id: 'resize-jpg',
        title: 'Resize JPG',
        description: 'Resize JPEG images with smart compression',
        icon: Ratio,
        badge: 'MEDIA',
        gradient: 'from-orange-500 to-amber-600',
        href: '/media-conversion/resize-jpg',
    },
    {
        id: 'resize-webp',
        title: 'Resize WebP',
        description: 'Resize WebP images for modern web',
        icon: Maximize2,
        badge: 'MEDIA',
        gradient: 'from-lime-500 to-green-600',
        href: '/media-conversion/resize-webp',
    },
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 100,
            damping: 12,
        },
    },
};

export default function MediaConversionPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                        <span className="text-sm font-medium text-white/90">14 tools</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                        Media Conversion
                    </h1>
                    <p className="text-xl text-white/70 max-w-2xl mx-auto">
                        Drop any video link and deliver downloadable video and MP3 files for reuse.
                    </p>
                </motion.div>

                {/* Tools Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {mediaTools.map((tool) => {
                        const IconComponent = tool.icon;
                        return (
                            <motion.div key={tool.id} variants={itemVariants}>
                                <Link href={tool.href}>
                                    <div className="group relative h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-purple-500/10">
                                        {/* Badge */}
                                        <div className="absolute top-4 right-4">
                                            <span className="px-3 py-1 text-xs font-semibold text-white/80 border border-white/20 rounded-full">
                                                {tool.badge}
                                            </span>
                                        </div>

                                        {/* Icon */}
                                        <div
                                            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            <IconComponent className="w-7 h-7 text-white" />
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                            {tool.title}
                                        </h3>
                                        <p className="text-sm text-white/60 leading-relaxed">
                                            {tool.description}
                                        </p>

                                        {/* Hover Effect Overlay */}
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300 pointer-events-none" />
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Footer Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-sm text-white/70">
                            All processing happens in your browser - 100% private & secure
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
