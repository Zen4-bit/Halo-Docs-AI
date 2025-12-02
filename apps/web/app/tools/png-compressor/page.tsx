'use client';

import { useState, useCallback } from 'react';
import { 
  Download, CheckCircle2, Image, TrendingDown, 
  Palette, Layers, Maximize, HardDrive
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

export default function PNGCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; originalSize: number; compressedSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Compression
  const [compressionLevel, setCompressionLevel] = useState<'light' | 'balanced' | 'aggressive'>('balanced');
  const [quality, setQuality] = useState(75);
  
  // PNG Options
  const [preserveTransparency, setPreserveTransparency] = useState(true);
  const [reduceColors, setReduceColors] = useState(false);
  const [colorPalette, setColorPalette] = useState(256);
  const [interlaced, setInterlaced] = useState(false);

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
      setProgress(5);
      
      // Log all settings being applied
      console.log('PNG Compression Settings:', {
        compressionLevel,
        quality,
        preserveTransparency,
        reduceColors,
        colorPalette,
        interlaced
      });
      
      setProgress(10);
      
      // Calculate quality based on compression level
      const qualityMap = { light: 0.9, balanced: 0.7, aggressive: 0.5 };
      const targetQuality = qualityMap[compressionLevel] * (quality / 100);
      
      // Load image to canvas for processing
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
      
      // Handle transparency
      if (!preserveTransparency) {
        // Fill with white background if transparency not preserved
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      setProgress(50);
      
      // Apply color reduction if enabled
      if (reduceColors && colorPalette < 256) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple color quantization - reduce color depth
        const factor = 256 / colorPalette;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.round((data[i] ?? 0) / factor) * factor;     // R
          data[i + 1] = Math.round((data[i + 1] ?? 0) / factor) * factor; // G
          data[i + 2] = Math.round((data[i + 2] ?? 0) / factor) * factor; // B
          // Alpha unchanged
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      setProgress(70);
      
      // Convert to blob with quality
      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Failed to compress')),
          'image/png'
        );
      });
      
      setProgress(90);
      
      // If still too large, use browser-image-compression as fallback
      let finalBlob = compressedBlob;
      if (compressedBlob.size > file.size * 0.9) {
        const options: any = {
          maxSizeMB: 10,
          useWebWorker: true,
          initialQuality: targetQuality,
          fileType: 'image/png',
        };
        const compressedFile = await imageCompression(
          new File([compressedBlob], file.name, { type: 'image/png' }), 
          options
        );
        finalBlob = compressedFile;
      }
      
      setProgress(100);
      
      const url = URL.createObjectURL(finalBlob);
      
      setResult({ 
        url, 
        name: file.name.replace('.png', '-compressed.png'), 
        originalSize: file.size, 
        compressedSize: finalBlob.size 
      });
    } catch (err: any) {
      console.error('Compression error:', err);
      setError(err.message || 'Failed to compress PNG. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [file, compressionLevel, quality, preserveTransparency, reduceColors, colorPalette, interlaced]);

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
  const estimatedReduction = compressionLevel === 'light' ? '10-20' : compressionLevel === 'balanced' ? '30-50' : '50-70';

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Compression */}
      <SettingsSection title="Compression" icon={<TrendingDown className="w-4 h-4" />}>
        <SettingsButtonGroup
          label="Level"
          value={compressionLevel}
          onChange={(v) => setCompressionLevel(v as typeof compressionLevel)}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'aggressive', label: 'Aggressive' },
          ]}
        />
        <p className="text-xs text-slate-400 dark:text-white/30 mt-2">~{estimatedReduction}% reduction</p>
        
        <div className="mt-3">
          <SettingsSlider
            label="Quality"
            value={quality}
            onChange={setQuality}
            min={10}
            max={100}
            unit="%"
          />
        </div>
      </SettingsSection>

      {/* PNG Options */}
      <SettingsSection title="PNG Options" icon={<Layers className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Preserve transparency"
          description="Keep alpha channel intact"
          checked={preserveTransparency}
          onChange={setPreserveTransparency}
        />
        <SettingsToggle
          label="Reduce colors"
          description="Use indexed color palette"
          checked={reduceColors}
          onChange={setReduceColors}
          icon={<Palette className="w-3 h-3" />}
        />
        {reduceColors && (
          <div className="mt-2">
            <SettingsSlider
              label="Color palette"
              value={colorPalette}
              onChange={setColorPalette}
              min={16}
              max={256}
              unit=" colors"
            />
          </div>
        )}
        <SettingsToggle
          label="Interlaced"
          description="Progressive loading"
          checked={interlaced}
          onChange={setInterlaced}
        />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="PNG Compressor"
      toolIcon={<Image className="w-5 h-5 text-white" />}
      toolColor="from-cyan-500 to-blue-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Compress PNG',
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
            accept=".png,image/png"
            multiple={false}
            title="Drop PNG image here"
            description="or click to browse • PNG files only"
            icon={<Image className="w-8 h-8" />}
            accentColor="blue"
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
              
              <div className="relative aspect-video rounded-xl overflow-hidden bg-[repeating-conic-gradient(#333_0%_25%,#222_0%_50%)] bg-[length:20px_20px]">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-white/5 flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-white/60">Estimated reduction</span>
                <span className="text-sm font-medium text-cyan-500 dark:text-cyan-400">{estimatedReduction}%</span>
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
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Compressing your PNG...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PNG Compressed!</h2>
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
                <div className="flex-1 h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 dark:bg-white/30 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-white/50 w-20">Compressed</span>
                <div className="flex-1 h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
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
              Download PNG
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
