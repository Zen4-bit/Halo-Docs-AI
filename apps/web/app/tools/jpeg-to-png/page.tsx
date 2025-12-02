'use client';

import { useState, useCallback } from 'react';
import { 
  Download, CheckCircle2, Image, ArrowRight,
  Wand2, Focus, Sparkles, Maximize, Palette, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider,
  SettingsInput,
  SettingsSelect
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

export default function JPEGToPNGPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; originalSize: number; convertedSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Conversion settings
  const [compressionLevel, setCompressionLevel] = useState(6);
  const [preserveTransparency, setPreserveTransparency] = useState(true);
  
  // Enhancement
  const [enhanceColors, setEnhanceColors] = useState(false);
  const [sharpen, setSharpen] = useState(false);
  const [denoise, setDenoise] = useState(false);
  
  // Resize
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  
  // Color depth
  const [colorDepth, setColorDepth] = useState<'24' | '32' | '8'>('24');

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

  const handleConvert = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      console.log('JPEG to PNG Settings:', {
        compressionLevel, preserveTransparency, enhanceColors, sharpen, denoise,
        colorDepth, resizeEnabled, resizeWidth, resizeHeight
      });
      
      setProgress(10);
      
      // Load image
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
      
      setProgress(30);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      let targetWidth = img.naturalWidth;
      let targetHeight = img.naturalHeight;
      
      // Apply resize if enabled
      if (resizeEnabled) {
        if (resizeWidth) targetWidth = parseInt(resizeWidth);
        if (resizeHeight) targetHeight = parseInt(resizeHeight);
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      setProgress(50);
      
      // Apply enhancements
      let filter = '';
      if (enhanceColors) filter += 'saturate(1.2) ';
      if (sharpen) filter += 'contrast(1.1) ';
      if (denoise) filter += 'blur(0.5px) ';
      if (filter) ctx.filter = filter.trim();
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      setProgress(70);
      
      // Convert to PNG
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed')), 'image/png');
      });
      
      setProgress(100);
      
      const url = URL.createObjectURL(blob);
      setResult({ 
        url, 
        name: file.name.replace(/\.(jpg|jpeg)$/i, '.png'), 
        originalSize: file.size, 
        convertedSize: blob.size 
      });
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert image');
    } finally {
      setProcessing(false);
    }
  }, [file, compressionLevel, preserveTransparency, enhanceColors, sharpen, denoise, colorDepth, resizeEnabled, resizeWidth, resizeHeight]);

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

  // Settings Panel
  const settingsPanel = (
    <>
      {/* PNG Settings */}
      <SettingsSection title="PNG Settings" icon={<Image className="w-4 h-4" />}>
        <SettingsSlider
          label="Compression level"
          value={compressionLevel}
          onChange={setCompressionLevel}
          min={0}
          max={9}
        />
        <p className="text-xs text-slate-400 dark:text-white/30">Higher = smaller file, slower conversion</p>
        
        <div className="mt-3">
          <SettingsSelect
            label="Color depth"
            value={colorDepth}
            onChange={(v) => setColorDepth(v as typeof colorDepth)}
            options={[
              { value: '24', label: '24-bit (RGB)' },
              { value: '32', label: '32-bit (RGBA with transparency)' },
              { value: '8', label: '8-bit (256 colors)' },
            ]}
            icon={<Palette className="w-3 h-3" />}
          />
        </div>
        
        <SettingsToggle
          label="Preserve transparency"
          description="Keep alpha channel if present"
          checked={preserveTransparency}
          onChange={setPreserveTransparency}
        />
      </SettingsSection>

      {/* Enhancement */}
      <SettingsSection title="Enhancement" icon={<Wand2 className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Enhance colors"
          description="Improve color vibrance"
          checked={enhanceColors}
          onChange={setEnhanceColors}
          icon={<Sparkles className="w-3 h-3" />}
        />
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
        />
      </SettingsSection>

      {/* Resize */}
      <SettingsSection title="Resize" icon={<Maximize className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Enable resize"
          description="Change image dimensions"
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
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="JPEG to PNG"
      toolIcon={<Image className="w-5 h-5 text-white" />}
      toolColor="from-blue-500 to-cyan-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Convert to PNG',
        onClick: handleConvert,
        disabled: !file,
        loading: processing,
        loadingText: `Converting... ${progress}%`,
        icon: <ArrowRight className="w-5 h-5" />,
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
            accentColor="blue"
            disabled={processing}
          />

          {/* Format Comparison */}
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
              
              {/* Format Info */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">From: JPEG</p>
                  <p className="text-xs text-slate-500 dark:text-white/40">Lossy compression</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">To: PNG</p>
                  <p className="text-xs text-slate-500 dark:text-white/40">Lossless, supports transparency</p>
                </div>
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
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Converting your image...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Converted to PNG!</h2>
            <p className="text-slate-600 dark:text-white/60">{result.name}</p>
          </motion.div>

          {/* Size Comparison */}
          <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-2 gap-6 text-center mb-6">
              <div>
                <p className="text-xs text-slate-500 dark:text-white/50 mb-1">Original JPEG</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSize(result.originalSize)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-white/50 mb-1">Converted PNG</p>
                <p className="text-lg font-bold text-blue-500 dark:text-blue-400">{formatSize(result.convertedSize)}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                PNG format supports transparency and lossless quality
              </p>
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
              Convert Another
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
