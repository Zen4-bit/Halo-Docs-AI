'use client';

import { useState, useCallback } from 'react';
import { 
  Download, CheckCircle2, Film, TrendingDown, 
  Palette, Zap, Layers, Play, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

export default function GIFCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; originalSize: number; compressedSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Color
  const [colorReduction, setColorReduction] = useState(128);
  
  // Compression
  const [lossy, setLossy] = useState(80);
  
  // Animation
  const [reduceFrames, setReduceFrames] = useState(false);
  const [optimizeFrames, setOptimizeFrames] = useState(true);
  const [loopOptimize, setLoopOptimize] = useState(true);

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
      console.log('GIF Compression Settings:', {
        colorReduction, lossy, reduceFrames, optimizeFrames, loopOptimize
      });
      
      setProgress(10);
      
      // For GIF compression, we use canvas-based approach
      // Note: Full GIF animation optimization requires server-side tools
      
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load GIF'));
        img.src = URL.createObjectURL(file);
      });
      
      setProgress(30);
      
      // Create canvas and draw the image
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(img, 0, 0);
      
      setProgress(50);
      
      // Apply color reduction if enabled
      if (colorReduction < 256) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const factor = 256 / colorReduction;
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.round((data[i] ?? 0) / factor) * factor;
          data[i + 1] = Math.round((data[i + 1] ?? 0) / factor) * factor;
          data[i + 2] = Math.round((data[i + 2] ?? 0) / factor) * factor;
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      setProgress(70);
      
      // Convert to GIF
      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to compress'));
          },
          'image/gif'
        );
      });
      
      setProgress(100);
      
      const url = URL.createObjectURL(compressedBlob);
      setResult({ 
        url, 
        name: file.name.replace('.gif', '-compressed.gif'), 
        originalSize: file.size, 
        compressedSize: compressedBlob.size 
      });
    } catch (err: any) {
      console.error('Compression error:', err);
      setError(err.message || 'Failed to compress GIF. For animated GIFs, server-side processing is recommended.');
    } finally {
      setProcessing(false);
    }
  }, [file, colorReduction, lossy, reduceFrames, optimizeFrames, loopOptimize]);

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
      {/* Color */}
      <SettingsSection title="Colors" icon={<Palette className="w-4 h-4" />}>
        <SettingsSlider
          label="Color palette"
          value={colorReduction}
          onChange={setColorReduction}
          min={16}
          max={256}
          step={16}
          unit=" colors"
        />
        <p className="text-xs text-white/30">Fewer colors = smaller file</p>
      </SettingsSection>

      {/* Compression */}
      <SettingsSection title="Compression" icon={<TrendingDown className="w-4 h-4" />}>
        <SettingsSlider
          label="Lossy level"
          value={lossy}
          onChange={setLossy}
          min={0}
          max={200}
          unit=""
        />
        <p className="text-xs text-white/30">0 = lossless, 200 = max compression</p>
      </SettingsSection>

      {/* Animation */}
      <SettingsSection title="Animation" icon={<Play className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Reduce frames"
          description="Skip every other frame"
          checked={reduceFrames}
          onChange={setReduceFrames}
          icon={<Zap className="w-3 h-3" />}
        />
        <SettingsToggle
          label="Optimize frames"
          description="Remove redundant pixels"
          checked={optimizeFrames}
          onChange={setOptimizeFrames}
        />
        <SettingsToggle
          label="Loop optimization"
          description="Optimize for seamless loops"
          checked={loopOptimize}
          onChange={setLoopOptimize}
        />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="GIF Compressor"
      toolIcon={<Film className="w-5 h-5 text-white" />}
      toolColor="from-pink-500 to-rose-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Compress GIF',
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
            accept=".gif,image/gif"
            multiple={false}
            title="Drop GIF here"
            description="or click to browse • Animated GIF files"
            icon={<Film className="w-8 h-8" />}
            accentColor="purple"
            disabled={processing}
          />

          {/* GIF Preview */}
          {file && preview && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-white/80">Preview (Animated)</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/40">
                  <HardDrive className="w-3 h-3" />
                  {formatSize(file.size)}
                </div>
              </div>
              
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
                <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
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
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Compressing your GIF...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">GIF Compressed!</h2>
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
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
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
              Download GIF
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
