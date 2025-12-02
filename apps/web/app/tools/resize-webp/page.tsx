'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, CheckCircle2, Image, Maximize2, Link2, Link2Off, Sparkles, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { SettingsSection, SettingsSlider, SettingsToggle, SettingsInput } from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

export default function ResizeWebPPage() {
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
  const [quality, setQuality] = useState(90);
  const [lossless, setLossless] = useState(false);

  const handleFilesChange = (files: File[]) => {
    const f = files[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setError(null); setResult(null); }
    else { setFile(null); setPreview(null); }
  };

  useEffect(() => {
    if (preview) {
      const img = new window.Image();
      img.onload = () => { setOriginalDimensions({ width: img.width, height: img.height }); setWidth(img.width); setHeight(img.height); };
      img.src = preview;
    }
  }, [preview]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (lockAspectRatio && originalDimensions.width > 0) setHeight(Math.round(newWidth * originalDimensions.height / originalDimensions.width));
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (lockAspectRatio && originalDimensions.height > 0) setWidth(Math.round(newHeight * originalDimensions.width / originalDimensions.height));
  };

  const handleResize = useCallback(async () => {
    if (!file || width <= 0 || height <= 0) return;
    setProcessing(true); setError(null); setProgress(0);
    try {
      console.log('Resize WebP Settings:', { width, height, quality, lossless, lockAspectRatio, originalDimensions });
      
      setProgress(20);
      
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
      
      setProgress(40);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      setProgress(70);
      
      const outputQuality = lossless ? 1 : quality / 100;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed')), 'image/webp', outputQuality);
      });
      
      setProgress(100);
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace('.webp', '-resized.webp'), size: blob.size });
    } catch (err: any) { 
      console.error('Resize error:', err);
      setError(err.message || 'Failed to resize WebP'); 
    }
    finally { setProcessing(false); }
  }, [file, width, height, quality, lossless, lockAspectRatio, originalDimensions]);

  const handleDownload = () => { if (result) { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); } };
  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); setProgress(0); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';

  const settingsPanel = (
    <>
      <SettingsSection title="Dimensions" icon={<Maximize2 className="w-4 h-4" />}>
        <div className="flex items-center gap-2">
          <SettingsInput label="Width" type="number" value={String(width)} onChange={(v) => handleWidthChange(parseInt(v) || 0)} placeholder="W" />
          <button onClick={() => setLockAspectRatio(!lockAspectRatio)} className={`mt-5 p-2 rounded-lg ${lockAspectRatio ? 'text-violet-400 bg-violet-500/20' : 'text-white/30 bg-white/5'}`}>
            {lockAspectRatio ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
          </button>
          <SettingsInput label="Height" type="number" value={String(height)} onChange={(v) => handleHeightChange(parseInt(v) || 0)} placeholder="H" />
        </div>
      </SettingsSection>
      <SettingsSection title="Quality" icon={<Sparkles className="w-4 h-4" />}>
        <SettingsToggle label="Lossless" description="Perfect quality output" checked={lossless} onChange={setLossless} />
        {!lossless && <div className="mt-3"><SettingsSlider label="Quality" value={quality} onChange={setQuality} min={10} max={100} unit="%" /></div>}
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout toolName="Resize WebP" toolIcon={<Sparkles className="w-5 h-5 text-white" />} toolColor="from-violet-500 to-fuchsia-500" settingsPanel={settingsPanel}
      actionButton={{ label: 'Resize WebP', onClick: handleResize, disabled: !file || width <= 0 || height <= 0, loading: processing, loadingText: `Resizing... ${progress}%`, icon: <Maximize2 className="w-5 h-5" /> }}>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <FileDropzone files={file ? [file] : []} onFilesChange={handleFilesChange} accept=".webp,image/webp" multiple={false} title="Drop WebP here" description="or click to browse • WebP files only" icon={<Image className="w-8 h-8" />} accentColor="purple" disabled={processing} />
          {file && preview && (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/80">Preview</h3>
                <div className="flex items-center gap-2 text-xs text-white/40"><HardDrive className="w-3 h-3" />{formatSize(file.size)}</div>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
                <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/5"><p className="text-xs text-white/40 mb-1">Original</p><p className="text-sm font-medium text-white">{originalDimensions.width} × {originalDimensions.height}px</p></div>
                <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20"><p className="text-xs text-violet-400/60 mb-1">New size</p><p className="text-sm font-medium text-violet-400">{width} × {height}px</p></div>
              </div>
            </div>
          )}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</motion.div>}</AnimatePresence>
          {processing && <div className="space-y-2"><div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div><p className="text-xs text-white/40 text-center">Resizing...</p></div>}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-400" /></div>
            <h2 className="text-2xl font-bold text-white mb-2">WebP Resized!</h2>
            <p className="text-white/60">{result.name} • {formatSize(result.size)}</p>
            <p className="text-white/40 text-sm mt-1">{width} × {height}px</p>
          </motion.div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10"><img src={result.url} alt="Resized" className="max-w-full mx-auto rounded-lg" /></div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download WebP</button>
            <button onClick={reset} className="px-8 py-4 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors">Resize Another</button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
