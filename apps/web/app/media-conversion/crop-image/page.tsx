'use client';

import React, { useState, useRef } from 'react';
import { Crop, Download } from 'lucide-react';
import { ToolShell } from '@/components/media/ToolShell';
import { DragDropZone } from '@/components/media/DragDropZone';
import { downloadBlob } from '@/lib/workerManager';
import { motion } from 'framer-motion';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

export default function CropImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
    const cropperRef = useRef<any>(null);

    const handleFilesAccepted = (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            if (!selectedFile) return;

            setFile(selectedFile);

            // Auto-detect format
            if (selectedFile.type.includes('png')) setFormat('png');
            else if (selectedFile.type.includes('webp')) setFormat('webp');
            else setFormat('jpeg');

            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleCrop = async () => {
        if (!cropperRef.current?.cropper) return;

        try {
            const cropper = cropperRef.current.cropper;
            const canvas = cropper.getCroppedCanvas();

            canvas.toBlob((blob: Blob | null) => {
                if (blob && file) {
                    const extension = format === 'jpeg' ? 'jpg' : format;
                    const filename = file.name.replace(/\.[^/.]+$/, '') + '_cropped.' + extension;
                    downloadBlob(blob, filename);
                }
            }, `image/${format}`, format === 'jpeg' ? 0.95 : undefined);
        } catch (err: any) {
            alert('Crop failed: ' + err.message);
        }
    };

    const aspectPresets = [
        { label: 'Free', value: undefined },
        { label: '1:1', value: 1 },
        { label: '4:3', value: 4 / 3 },
        { label: '16:9', value: 16 / 9 },
        { label: '9:16', value: 9 / 16 },
    ];

    return (
        <ToolShell
            title="Crop Image"
            description="Crop and resize images to perfect dimensions"
            icon={<Crop className="w-10 h-10 text-white" />}
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
                        {/* Cropper */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Crop Area</h3>
                            <div className="rounded-xl overflow-hidden bg-black/20">
                                <Cropper
                                    ref={cropperRef}
                                    src={preview}
                                    style={{ height: 400, width: '100%' }}
                                    {...(aspectRatio !== undefined && { aspectRatio })}
                                    guides={true}
                                    viewMode={1}
                                    background={false}
                                    responsive={true}
                                    autoCropArea={1}
                                    checkOrientation={false}
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Aspect Ratio */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Aspect Ratio</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {aspectPresets.map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => setAspectRatio(preset.value)}
                                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${aspectRatio === preset.value
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Output Format */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Output Format</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['jpeg', 'png', 'webp'] as const).map((fmt) => (
                                        <button
                                            key={fmt}
                                            onClick={() => setFormat(fmt)}
                                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${format === fmt
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                }`}
                                        >
                                            {fmt.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Crop Button */}
                        <button
                            onClick={handleCrop}
                            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Download className="w-5 h-5 inline mr-2" />
                            Crop & Download
                        </button>
                    </motion.div>
                )}
            </div>
        </ToolShell>
    );
}
