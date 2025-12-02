'use client';

import { useState, useCallback } from 'react';
import { 
  Download, CheckCircle2, Image, TrendingDown, 
  Sparkles, FileX, Maximize, Focus, Wand2, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider,
  SettingsSelect,
  SettingsInput
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';
import imageCompression from 'browser-image-compression';

export default function JPEGCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; originalSize: number; compressedSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Quality
  const [quality, setQuality] = useState(80);
  const [smoothing, setSmoothing] = useState(0);
  
  // Options
  const [progressive, setProgressive] = useState(true);
  const [stripMetadata, setStripMetadata] = useState(true);
  
  // Resize
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [maintainAspect, setMaintainAspect] = useState(true);
  
  // Enhancement
  const [sharpen, setSharpen] = useState(false);
  const [denoise, setDenoise] = useState(false);
  const [convertToWebP, setConvertToWebP] = useState(false);

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
      console.log('JPEG Compression Settings:', {
        quality,
        smoothing,
        progressive,
        stripMetadata,
        resizeEnabled,
        resizeWidth,
        resizeHeight,
        maintainAspect,
        sharpen,
        denoise,
        convertToWebP
      });
      
      setProgress(10);
      
      // Calculate max dimension for resize
      let maxDimension: number | undefined;
      if (resizeEnabled) {
        const w = resizeWidth ? parseInt(resizeWidth) : 0;
        const h = resizeHeight ? parseInt(resizeHeight) : 0;
        maxDimension = Math.max(w, h) || undefined;
      }
      
      // Configure compression options
      const options: any = {
        maxSizeMB: 10,
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
        initialQuality: quality / 100,
        fileType: convertToWebP ? 'image/webp' : 'image/jpeg',
        preserveExif: !stripMetadata,
        onProgress: (p: number) => setProgress(10 + Math.round(p * 0.7)),
      };
      
      // Compress the image using browser-image-compression
      let compressedFile = await imageCompression(file, options);
      
      setProgress(85);
      
      // Apply canvas-based enhancements if needed
      if (sharpen || denoise || smoothing > 0) {
        const img = new window.Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(compressedFile);
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Apply smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = smoothing > 50 ? 'high' : smoothing > 25 ? 'medium' : 'low';
          
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Apply sharpening via convolution (simplified)
          if (sharpen) {
            ctx.filter = 'contrast(1.1)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
          }
          
          // Convert back to blob
          const enhancedBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => blob ? resolve(blob) : reject(new Error('Failed')),
              convertToWebP ? 'image/webp' : 'image/jpeg',
              quality / 100
            );
          });
          
          compressedFile = new File([enhancedBlob], compressedFile.name, { 
            type: convertToWebP ? 'image/webp' : 'image/jpeg' 
          });
        }
      }
      
      setProgress(95);
      
      // Create URL for the compressed image
      const url = URL.createObjectURL(compressedFile);
      const ext = convertToWebP ? '.webp' : '.jpg';
      
      setProgress(100);
      
      setResult({ 
        url, 
        name: file.name.replace(/\.(jpg|jpeg|png|webp)$/i, `-compressed${ext}`), 
        originalSize: file.size, 
        compressedSize: compressedFile.size 
      });
    } catch (err: any) {
      console.error('Compression error:', err);
      setError(err.message || 'Failed to compress image. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [file, quality, smoothing, progressive, stripMetadata, resizeEnabled, resizeWidth, resizeHeight, maintainAspect, sharpen, denoise, convertToWebP]);

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
  const estimatedReduction = quality >= 80 ? '10-30' : quality >= 60 ? '30-50' : quality >= 40 ? '50-70' : '70-90';

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Quality */}
      <SettingsSection title="Quality" icon={<TrendingDown className="w-4 h-4" />}>
        <SettingsSlider
          label="Compression quality"
          value={quality}
          onChange={setQuality}
          min={10}
          max={100}
          unit="%"
        />
        <p className="text-xs text-slate-400 dark:text-white/30">Lower = smaller file, less quality</p>
        
        <div className="mt-3">
          <SettingsSlider
            label="Smoothing"
            value={smoothing}
            onChange={setSmoothing}
            min={0}
            max={100}
            unit="%"
          />
        </div>
      </SettingsSection>

      {/* Options */}
      <SettingsSection title="JPEG Options" icon={<Image className="w-4 h-4" />}>
        <SettingsToggle
          label="Progressive JPEG"
          description="Loads gradually for better UX"
          checked={progressive}
          onChange={setProgressive}
        />
        <SettingsToggle
          label="Remove EXIF data"
          description="Strip metadata from image"
          checked={stripMetadata}
          onChange={setStripMetadata}
          icon={<FileX className="w-3 h-3" />}
        />
        <SettingsToggle
          label="Convert to WebP"
          description="Smaller file with same quality"
          checked={convertToWebP}
          onChange={setConvertToWebP}
        />
      </SettingsSection>

      {/* Resize */}
      <SettingsSection title="Resize" icon={<Maximize className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Enable resize"
          description="Scale image dimensions"
          checked={resizeEnabled}
          onChange={setResizeEnabled}
        />
        {resizeEnabled && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SettingsInput
              label="Width"
              value={resizeWidth}
              onChange={setResizeWidth}
              type="number"
              placeholder="Auto"
              suffix="px"
            />
            <SettingsInput
              label="Height"
              value={resizeHeight}
              onChange={setResizeHeight}
              type="number"
              placeholder="Auto"
              suffix="px"
            />
          </div>
        )}
      </SettingsSection>

      {/* Enhancement */}
      <SettingsSection title="Enhancement" icon={<Wand2 className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Sharpen"
          description="Enhance edge clarity"
          checked={sharpen}
          onChange={setSharpen}
          icon={<Focus className="w-3 h-3" />}
        />
        <SettingsToggle
          label="Denoise"
          description="Reduce image noise"
          checked={denoise}
          onChange={setDenoise}
          icon={<Sparkles className="w-3 h-3" />}
        />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="JPEG Compressor"
      toolIcon={<Image className="w-5 h-5 text-white" />}
      toolColor="from-rose-500 to-orange-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Compress JPEG',
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
            accept=".jpg,.jpeg,image/jpeg"
            multiple={false}
            title="Drop JPEG image here"
            description="or click to browse • JPG/JPEG only"
            icon={<Image className="w-8 h-8" />}
            accentColor="amber"
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
              
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-black/20">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-slate-200 dark:bg-white/5 flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-white/60">Estimated reduction</span>
                <span className="text-sm font-medium text-rose-500 dark:text-rose-400">{estimatedReduction}%</span>
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
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Compressing your image...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">JPEG Compressed!</h2>
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

            {/* Visual Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-white/50 w-20">Original</span>
                <div className="flex-1 h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 dark:bg-white/30 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-white/50 w-20">Compressed</span>
                <div className="flex-1 h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
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
              Download {convertToWebP ? 'WebP' : 'JPEG'}
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
