'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Download, CheckCircle2, Image, Maximize2, Link2, Link2Off, 
  Percent, Layers, Monitor, Smartphone, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider,
  SettingsButtonGroup,
  SettingsInput
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

// Client-side image resize function using Canvas
async function resizeImageClientSide(
  file: File, 
  targetWidth: number, 
  targetHeight: number, 
  outputQuality: number,
  outputFormat: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Use high quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the resized image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Convert to blob
      const mimeType = outputFormat === 'png' ? 'image/png' : 
                       outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        mimeType,
        outputQuality / 100
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const PRESETS = [
  { id: 'custom', label: 'Custom', width: 0, height: 0 },
  { id: 'hd', label: 'HD', width: 1280, height: 720 },
  { id: 'fhd', label: 'FHD', width: 1920, height: 1080 },
  { id: '4k', label: '4K', width: 3840, height: 2160 },
  { id: 'instagram', label: 'IG', width: 1080, height: 1080 },
  { id: 'twitter', label: 'Twitter', width: 1200, height: 675 },
];

export default function ImageResizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [resizeMode, setResizeMode] = useState<'pixels' | 'percentage'>('pixels');
  const [percentage, setPercentage] = useState(100);
  const [preset, setPreset] = useState('custom');
  const [quality, setQuality] = useState(90);
  const [format, setFormat] = useState<'original' | 'jpg' | 'png' | 'webp'>('original');

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

  useEffect(() => {
    if (preview) {
      const img = new window.Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = preview;
    }
  }, [preview]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (lockAspectRatio && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(newWidth * ratio));
    }
    setPreset('custom');
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (lockAspectRatio && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(newHeight * ratio));
    }
    setPreset('custom');
  };

  const handlePercentageChange = (newPercent: number) => {
    setPercentage(newPercent);
    setWidth(Math.round(originalDimensions.width * newPercent / 100));
    setHeight(Math.round(originalDimensions.height * newPercent / 100));
  };

  const handlePresetChange = (presetId: string) => {
    setPreset(presetId);
    const p = PRESETS.find(pr => pr.id === presetId);
    if (p && p.width > 0) {
      setWidth(p.width);
      setHeight(p.height);
      setResizeMode('pixels');
    }
  };

  const handleResize = useCallback(async () => {
    if (!file || width <= 0 || height <= 0) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Log all settings being applied
      console.log('Image Resize Settings:', {
        width,
        height,
        lockAspectRatio,
        resizeMode,
        percentage,
        preset,
        quality,
        format,
        originalDimensions
      });
      
      setProgress(10);
      
      // Calculate actual dimensions based on mode
      let targetWidth = width;
      let targetHeight = height;
      
      if (resizeMode === 'percentage') {
        targetWidth = Math.round(originalDimensions.width * (percentage / 100));
        targetHeight = Math.round(originalDimensions.height * (percentage / 100));
      }
      
      setProgress(20);
      
      // Determine output format
      const outputFormat = format === 'original' 
        ? (file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg')
        : format;
      
      setProgress(40);
      
      // Resize the image client-side
      const resizedBlob = await resizeImageClientSide(file, targetWidth, targetHeight, quality, outputFormat);
      
      setProgress(80);
      
      // Create URL for the resized image
      const url = URL.createObjectURL(resizedBlob);
      const ext = outputFormat === 'png' ? '.png' : outputFormat === 'webp' ? '.webp' : '.jpg';
      
      setProgress(100);
      
      setResult({ 
        url, 
        name: file.name.replace(/\.[^.]+$/, `-resized${ext}`), 
        size: resizedBlob.size 
      });
    } catch (err: any) {
      console.error('Resize error:', err);
      setError(err.message || 'Failed to resize image. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [file, width, height, lockAspectRatio, resizeMode, percentage, preset, quality, format, originalDimensions]);

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
    setWidth(0);
    setHeight(0);
    setPreset('custom');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Dimensions */}
      <SettingsSection title="Dimensions" icon={<Maximize2 className="w-4 h-4" />}>
        <SettingsButtonGroup
          label="Mode"
          value={resizeMode}
          onChange={(v) => setResizeMode(v as typeof resizeMode)}
          options={[
            { value: 'pixels', label: 'Pixels' },
            { value: 'percentage', label: '%' },
          ]}
        />
        
        {resizeMode === 'pixels' ? (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <SettingsInput
                label="Width"
                type="number"
                value={String(width)}
                onChange={(v) => handleWidthChange(parseInt(v) || 0)}
                placeholder="Width"
              />
              <button
                onClick={() => setLockAspectRatio(!lockAspectRatio)}
                className={`mt-5 p-2 rounded-lg transition-colors ${
                  lockAspectRatio ? 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/20' : 'text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/5'
                }`}
              >
                {lockAspectRatio ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
              </button>
              <SettingsInput
                label="Height"
                type="number"
                value={String(height)}
                onChange={(v) => handleHeightChange(parseInt(v) || 0)}
                placeholder="Height"
              />
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <SettingsSlider
              label="Scale"
              value={percentage}
              onChange={handlePercentageChange}
              min={10}
              max={200}
              unit="%"
            />
          </div>
        )}
      </SettingsSection>

      {/* Presets */}
      <SettingsSection title="Presets" icon={<Monitor className="w-4 h-4" />} defaultOpen={false}>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.filter(p => p.id !== 'custom').map(p => (
            <button
              key={p.id}
              onClick={() => handlePresetChange(p.id)}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                preset === p.id 
                  ? 'bg-indigo-500/30 text-slate-900 dark:text-white' 
                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Quality & Format */}
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
      toolName="Image Resizer"
      toolIcon={<Maximize2 className="w-5 h-5 text-white" />}
      toolColor="from-indigo-500 to-purple-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Resize Image',
        onClick: handleResize,
        disabled: !file || width <= 0 || height <= 0,
        loading: processing,
        loadingText: `Resizing... ${progress}%`,
        icon: <Maximize2 className="w-5 h-5" />,
      }}
    >
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* File Dropzone */}
          <FileDropzone
            files={file ? [file] : []}
            onFilesChange={handleFilesChange}
            accept="image/*"
            multiple={false}
            title="Drop image here"
            description="or click to browse • PNG, JPG, WebP, GIF"
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
              
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
                <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                  <p className="text-xs text-slate-500 dark:text-white/40 mb-1">Original</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{originalDimensions.width} × {originalDimensions.height}px</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-xs text-indigo-500/60 dark:text-indigo-400/60 mb-1">New size</p>
                  <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400">{width} × {height}px</p>
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
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Resizing your image...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Image Resized!</h2>
            <p className="text-slate-600 dark:text-white/60">{result.name} • {formatSize(result.size)}</p>
            <p className="text-slate-500 dark:text-white/40 text-sm mt-1">New size: {width} × {height}px</p>
          </motion.div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <img src={result.url} alt="Resized" className="max-w-full mx-auto rounded-lg" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold 
                hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Image
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Resize Another
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
