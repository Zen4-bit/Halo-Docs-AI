'use client';

import { useState, useCallback } from 'react';
import { Download, CheckCircle2, Crop, Ratio, Sparkles, Image, HardDrive, RotateCw, FlipHorizontal, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { SettingsSection, SettingsSlider, SettingsToggle, SettingsButtonGroup } from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

const ASPECT_RATIOS = [
  { value: 'free', label: 'Free' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9' },
  { value: 'custom', label: 'Custom' },
];

export default function CropWebPPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Aspect Ratio
  const [aspectRatio, setAspectRatio] = useState('free');
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
  // Transform
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(100);
  // Quality
  const [quality, setQuality] = useState(90);
  const [lossless, setLossless] = useState(false);
  // Animation (WebP specific)
  const [keepAnimation, setKeepAnimation] = useState(true);
  const [flattenAnimation, setFlattenAnimation] = useState(false);
  const [convertToStill, setConvertToStill] = useState(false);

  const handleFilesChange = (files: File[]) => {
    const f = files[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setError(null); setResult(null); }
    else { setFile(null); setPreview(null); }
  };

  const handleCrop = useCallback(async () => {
    if (!file) return;
    setProcessing(true); setError(null); setProgress(0);
    try {
      console.log('Crop WebP Settings:', {
        cropArea, quality, lossless, aspectRatio, rotation, flipH, flipV, zoom,
        keepAnimation, flattenAnimation, convertToStill
      });
      
      setProgress(10);
      
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
      
      setProgress(30);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      const zoomFactor = zoom / 100;
      const cropX = Math.round(cropArea.x / zoomFactor);
      const cropY = Math.round(cropArea.y / zoomFactor);
      const cropW = Math.round(cropArea.width / zoomFactor);
      const cropH = Math.round(cropArea.height / zoomFactor);
      
      canvas.width = cropW;
      canvas.height = cropH;
      
      setProgress(50);
      
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, cropX, cropY, cropW, cropH, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      ctx.restore();
      
      setProgress(85);
      
      const outputQuality = lossless ? 1 : quality / 100;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed')), 'image/webp', outputQuality);
      });
      
      setProgress(100);
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace('.webp', '-cropped.webp'), size: blob.size });
    } catch (err: any) { 
      console.error('Crop error:', err);
      setError(err.message || 'Failed to crop WebP'); 
    }
    finally { setProcessing(false); }
  }, [file, cropArea, quality, lossless, aspectRatio, rotation, flipH, flipV, zoom, keepAnimation, flattenAnimation, convertToStill]);

  const handleDownload = () => { if (result) { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); } };
  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); setProgress(0); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';

  const settingsPanel = (
    <>
      <SettingsSection title="Aspect Ratio" icon={<Ratio className="w-4 h-4" />}>
        <SettingsButtonGroup label="Ratio" options={ASPECT_RATIOS} value={aspectRatio} onChange={setAspectRatio} />
      </SettingsSection>
      <SettingsSection title="Transform" icon={<RotateCw className="w-4 h-4" />}>
        <SettingsSlider label="Rotation" value={rotation} onChange={setRotation} min={-180} max={180} unit="°" />
        <div className="mt-2 flex gap-4">
          <SettingsToggle label="Flip H" checked={flipH} onChange={setFlipH} />
          <SettingsToggle label="Flip V" checked={flipV} onChange={setFlipV} />
        </div>
        <div className="mt-2"><SettingsSlider label="Zoom" value={zoom} onChange={setZoom} min={50} max={200} unit="%" /></div>
      </SettingsSection>
      <SettingsSection title="Quality" icon={<Sparkles className="w-4 h-4" />}>
        <SettingsToggle label="Lossless" description="Perfect quality" checked={lossless} onChange={setLossless} />
        {!lossless && <div className="mt-2"><SettingsSlider label="Quality" value={quality} onChange={setQuality} min={10} max={100} unit="%" /></div>}
      </SettingsSection>
      <SettingsSection title="Animation" icon={<Layers className="w-4 h-4" />}>
        <SettingsToggle label="Keep animation" description="Preserve frames" checked={keepAnimation} onChange={setKeepAnimation} />
        <div className="mt-2"><SettingsToggle label="Flatten animation" checked={flattenAnimation} onChange={setFlattenAnimation} /></div>
        <div className="mt-2"><SettingsToggle label="Convert to still" description="First frame only" checked={convertToStill} onChange={setConvertToStill} /></div>
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout toolName="Crop WebP" toolIcon={<Crop className="w-5 h-5 text-white" />} toolColor="from-violet-500 to-fuchsia-500" settingsPanel={settingsPanel}
      actionButton={{ label: 'Crop WebP', onClick: handleCrop, disabled: !file, loading: processing, loadingText: `Cropping... ${progress}%`, icon: <Crop className="w-5 h-5" /> }}>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <FileDropzone files={file ? [file] : []} onFilesChange={handleFilesChange} accept=".webp,image/webp" multiple={false} title="Drop WebP here" description="or click to browse • WebP files only" icon={<Image className="w-8 h-8" />} accentColor="purple" disabled={processing} />
          {file && preview && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-white/80">Preview & Crop</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/40"><HardDrive className="w-3 h-3" />{formatSize(file.size)}</div>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-black/20 flex items-center justify-center">
                <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                <div className="absolute inset-0 bg-black/50">
                  <div className="absolute border-2 border-violet-400 bg-transparent" style={{ left: cropArea.x, top: cropArea.y, width: cropArea.width, height: cropArea.height }}>
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">{[...Array(9)].map((_, i) => <div key={i} className="border border-white/20" />)}</div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-white/40 text-center">Crop area: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px</p>
            </div>
          )}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</motion.div>}</AnimatePresence>
          {processing && <div className="space-y-2"><div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div><p className="text-xs text-slate-500 dark:text-white/40 text-center">Cropping...</p></div>}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" /></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">WebP Cropped!</h2>
            <p className="text-slate-600 dark:text-white/60">{result.name} • {formatSize(result.size)}</p>
          </motion.div>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"><img src={result.url} alt="Cropped" className="max-w-full mx-auto rounded-lg" /></div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download WebP</button>
            <button onClick={reset} className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Crop Another</button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
