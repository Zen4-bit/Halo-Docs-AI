'use client';

import { useState, useCallback } from 'react';
import { 
  Download, CheckCircle2, Package, X, Image, 
  Maximize2, Link2, Link2Off, Trash2, Layers, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsSlider,
  SettingsButtonGroup,
  SettingsInput,
  SettingsToggle
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

interface FileItem {
  file: File;
  preview: string;
  id: string;
}

export default function BulkResizePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [quality, setQuality] = useState(90);
  const [format, setFormat] = useState<'original' | 'jpg' | 'png' | 'webp'>('original');

  const handleFilesChange = (newFiles: File[]) => {
    const fileItems = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }));
    setFiles(fileItems);
    setError(null);
    setResult(null);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleBulkResize = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((item) => {
        formData.append(`files`, item.file);
      });
      formData.append('width', String(width));
      formData.append('height', String(height));
      formData.append('quality', String(quality));
      formData.append('format', format);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 200);

      const response = await fetch('/api/tools/bulk-resize', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Bulk resize failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: `resized-images-${Date.now()}.zip` });
    } catch (err: any) {
      setError(err.message || 'Failed to resize images');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.name;
      a.click();
    }
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Dimensions */}
      <SettingsSection title="Dimensions" icon={<Maximize2 className="w-4 h-4" />}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SettingsInput
              label="Width"
              type="number"
              value={String(width)}
              onChange={(v) => setWidth(parseInt(v) || 0)}
              placeholder="Width"
            />
            <button
              onClick={() => setLockAspectRatio(!lockAspectRatio)}
              className={`mt-5 p-2 rounded-lg transition-colors ${
                lockAspectRatio ? 'text-amber-400 bg-amber-500/20' : 'text-white/30 bg-white/5'
              }`}
            >
              {lockAspectRatio ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
            </button>
            <SettingsInput
              label="Height"
              type="number"
              value={String(height)}
              onChange={(v) => setHeight(parseInt(v) || 0)}
              placeholder="Height"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Output */}
      <SettingsSection title="Output" icon={<Layers className="w-4 h-4" />} defaultOpen={false}>
        <SettingsSlider
          label="Quality"
          value={quality}
          onChange={setQuality}
          min={10}
          max={100}
          unit="%"
        />
        <div className="mt-3">
          <SettingsButtonGroup
            label="Format"
            value={format}
            onChange={(v) => setFormat(v as typeof format)}
            options={[
              { value: 'original', label: 'Same' },
              { value: 'jpg', label: 'JPG' },
              { value: 'png', label: 'PNG' },
              { value: 'webp', label: 'WebP' },
            ]}
          />
        </div>
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="Bulk Resize"
      toolIcon={<Package className="w-5 h-5 text-white" />}
      toolColor="from-amber-500 to-orange-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: `Resize ${files.length} Images`,
        onClick: handleBulkResize,
        disabled: files.length === 0,
        loading: processing,
        loadingText: `Resizing... ${progress}%`,
        icon: <Package className="w-5 h-5" />,
      }}
    >
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* File Dropzone */}
          <FileDropzone
            files={files.map(f => f.file)}
            onFilesChange={handleFilesChange}
            accept="image/*"
            multiple={true}
            title="Drop multiple images here"
            description="or click to browse • PNG, JPG, WebP, GIF"
            icon={<Image className="w-8 h-8" />}
            accentColor="amber"
            disabled={processing}
          />

          {/* File Grid */}
          {files.length > 0 && (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{files.length} images</span>
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-white/40">{formatSize(totalSize)} total</span>
                </div>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {files.map(item => (
                  <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden bg-black/20">
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(item.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-sm text-amber-400">
                  Output: {width} × {height}px
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-white/40 text-center">Resizing {files.length} images...</p>
            </div>
          )}
        </div>
      ) : (
        /* Success State */
        <div className="max-w-lg mx-auto text-center py-12 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex p-6 rounded-3xl bg-green-500/20"
          >
            <CheckCircle2 className="w-16 h-16 text-green-400" />
          </motion.div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Batch Resize Complete!</h2>
            <p className="text-white/60">{files.length} images resized to {width}×{height}px</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold 
                hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download ZIP
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors"
            >
              Resize More
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
