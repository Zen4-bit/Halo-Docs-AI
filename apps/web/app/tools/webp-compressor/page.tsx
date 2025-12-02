'use client';

import { useState, useCallback } from 'react';
import { 
  Download, CheckCircle2, Image, TrendingDown, 
  Sparkles, Layers, HardDrive, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider,
  SettingsButtonGroup
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';
import imageCompression from 'browser-image-compression';

export default function WebPCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; originalSize: number; compressedSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Quality
  const [quality, setQuality] = useState(80);
  const [lossless, setLossless] = useState(false);
  
  // Advanced
  const [method, setMethod] = useState(4);
  const [preserveExif, setPreserveExif] = useState(false);
  const [alphaQuality, setAlphaQuality] = useState(100);

  const handleFilesChange = (files: File[]) => {
    const selectedFile = files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
      setResult(null);
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleCompress = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      console.log('WebP Compression Settings:', {
        quality, lossless, method, preserveExif, alphaQuality
      });
      
      setProgress(10);
      
      // Load image for canvas processing
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
      
      setProgress(30);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0);
      
      setProgress(60);
      
      // Convert to WebP with quality
      const outputQuality = lossless ? 1 : quality / 100;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
          'image/webp',
          outputQuality
        );
      });
      
      setProgress(100);
      
      const url = URL.createObjectURL(blob);
      
      setResult({ 
        url, 
        name: file.name.replace(/\.(webp|png|jpg|jpeg)$/i, '-compressed.webp'), 
        originalSize: file.size, 
        compressedSize: blob.size 
      });
    } catch (err: any) {
      console.error('Compression error:', err);
      setError(err.message || 'Failed to compress WebP. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [file, quality, lossless, method, preserveExif, alphaQuality]);

  const handleDownload = () => {
    if (result) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.name;
      a.click();
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const compressionRatio = result ? Math.round((1 - result.compressedSize / result.originalSize) * 100) : 0;

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Quality */}
      <SettingsSection title="Quality" icon={<TrendingDown className="w-4 h-4" />}>
        <SettingsToggle
          label="Lossless mode"
          description="Perfect quality, larger size"
          checked={lossless}
          onChange={setLossless}
          icon={<Sparkles className="w-3 h-3" />}
        />
        {!lossless && (
          <div className="mt-3">
            <SettingsSlider
              label="Quality level"
              value={quality}
              onChange={setQuality}
              min={10}
              max={100}
              unit="%"
            />
          </div>
        )}
      </SettingsSection>

      {/* Advanced */}
      <SettingsSection title="Advanced" icon={<Layers className="w-4 h-4" />} defaultOpen={false}>
        <SettingsSlider
          label="Compression method"
          value={method}
          onChange={setMethod}
          min={0}
          max={6}
          unit=""
        />
        <p className="text-xs text-white/30 mb-3">Higher = slower but better</p>
        
        {!lossless && (
          <SettingsSlider
            label="Alpha quality"
            value={alphaQuality}
            onChange={setAlphaQuality}
            min={0}
            max={100}
            unit="%"
          />
        )}
        
        <SettingsToggle
          label="Preserve EXIF"
          description="Keep image metadata"
          checked={preserveExif}
          onChange={setPreserveExif}
        />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="WebP Compressor"
      toolIcon={<Sparkles className="w-5 h-5 text-white" />}
      toolColor="from-violet-500 to-fuchsia-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Compress WebP',
        onClick: handleCompress,
        disabled: !file,
        loading: processing,
        loadingText: `Compressing... ${progress}%`,
        icon: <TrendingDown className="w-5 h-5" />,
      }}
    >
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* File Dropzone */}
          <FileDropzone
            files={file ? [file] : []}
            onFilesChange={handleFilesChange}
            accept=".webp,image/webp"
            multiple={false}
            title="Drop WebP image here"
            description="or click to browse • WebP files only"
            icon={<Image className="w-8 h-8" />}
            accentColor="purple"
            disabled={processing}
          />

          {/* Image Preview */}
          {file && preview && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-white/80">Preview</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/40">
                  <HardDrive className="w-3 h-3" />
                  {formatSize(file.size)}
                </div>
              </div>
              
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-white/5 flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-white/60">Mode</span>
                <span className="text-sm font-medium text-violet-500 dark:text-violet-400">{lossless ? 'Lossless' : `Lossy ${quality}%`}</span>
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
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Compressing your WebP...</p>
            </div>
          )}
        </div>
      ) : (
        /* Success State */
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center py-8"
          >
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">WebP Compressed!</h2>
            <p className="text-slate-600 dark:text-white/60">Reduced by {compressionRatio}%</p>
          </motion.div>

          {/* Size Comparison */}
          <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-2 gap-6 text-center mb-6">
              <div>
                <p className="text-xs text-slate-500 dark:text-white/50 mb-1">Original</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSize(result.originalSize)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-white/50 mb-1">Compressed</p>
                <p className="text-lg font-bold text-green-500 dark:text-green-400">{formatSize(result.compressedSize)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-white/50 w-20">Original</span>
                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 dark:bg-white/30 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-white/50 w-20">Compressed</span>
                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: `${100 - compressionRatio}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold 
                hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download WebP
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Compress Another
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
