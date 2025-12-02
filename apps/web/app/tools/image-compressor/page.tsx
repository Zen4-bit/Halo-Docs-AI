'use client';

import { useState } from 'react';
import { Download, CheckCircle2, Image, Minimize2, Zap, HardDrive, Sparkles, Maximize2, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { SettingsSection, SettingsSlider, SettingsToggle, SettingsButtonGroup, SettingsSelect } from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

type ImageFormat = 'auto' | 'jpeg' | 'png' | 'webp' | 'avif';
const FORMAT_OPTIONS = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
];

const COLOR_PROFILES = [
  { value: 'srgb', label: 'sRGB' },
  { value: 'adobe', label: 'Adobe RGB' },
  { value: 'p3', label: 'Display P3' },
];

export default function ImageCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number; originalSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string>('');
  
  // Compression
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState(0);
  // Resize
  const [resizePercent, setResizePercent] = useState(100);
  // Enhancements
  const [autoEnhance, setAutoEnhance] = useState(false);
  const [denoise, setDenoise] = useState(false);
  const [sharpen, setSharpen] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  // Metadata
  const [removeExif, setRemoveExif] = useState(true);
  const [keepGps, setKeepGps] = useState(false);
  // Color
  const [colorProfile, setColorProfile] = useState('srgb');

  const handleFilesChange = (files: File[]) => {
    const f = files[0];
    if (f) {
      setFile(f); setPreview(URL.createObjectURL(f)); setError(null); setResult(null);
      setDetectedFormat(f.name.split('.').pop()?.toLowerCase() || '');
    } else { setFile(null); setPreview(null); }
  };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true); setError(null); setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outputFormat', outputFormat);
      formData.append('quality', String(quality));
      formData.append('targetSize', String(targetSize));
      formData.append('resizePercent', String(resizePercent));
      formData.append('autoEnhance', String(autoEnhance));
      formData.append('denoise', String(denoise));
      formData.append('sharpen', String(sharpen));
      formData.append('brightness', String(brightness));
      formData.append('contrast', String(contrast));
      formData.append('removeExif', String(removeExif));
      formData.append('keepGps', String(keepGps));
      formData.append('colorProfile', colorProfile);
      const progressInterval = setInterval(() => setProgress(prev => Math.min(prev + 5, 90)), 100);
      const response = await fetch('/api/tools/image-compressor', { method: 'POST', body: formData });
      clearInterval(progressInterval); setProgress(100);
      if (!response.ok) throw new Error('Compression failed');
      const blob = await response.blob();
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace(/\.[^.]+$/, `-compressed.${outputFormat}`), size: blob.size, originalSize: file.size });
    } catch (err: any) { setError(err.message || 'Failed to compress image'); }
    finally { setProcessing(false); }
  };

  const handleDownload = () => { if (result) { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); } };
  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); setProgress(0); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';
  const compressionRatio = result ? Math.round((1 - result.size / result.originalSize) * 100) : 0;

  const settingsPanel = (
    <>
      <SettingsSection title="Compression" icon={<Zap className="w-4 h-4" />}>
        <SettingsButtonGroup label="Format" options={FORMAT_OPTIONS} value={outputFormat} onChange={(v) => setOutputFormat(v as ImageFormat)} />
        <div className="mt-2"><SettingsSlider label="Quality" value={quality} onChange={setQuality} min={10} max={100} unit="%" /></div>
        <div className="mt-2"><SettingsSlider label="Target size (MB)" value={targetSize} onChange={setTargetSize} min={0} max={10} unit=" MB" /></div>
      </SettingsSection>
      <SettingsSection title="Resize" icon={<Maximize2 className="w-4 h-4" />}>
        <SettingsSlider label="Scale" value={resizePercent} onChange={setResizePercent} min={10} max={200} unit="%" />
      </SettingsSection>
      <SettingsSection title="Enhancements" icon={<Sparkles className="w-4 h-4" />}>
        <SettingsToggle label="Auto enhance" checked={autoEnhance} onChange={setAutoEnhance} />
        <div className="mt-2"><SettingsToggle label="Denoise" checked={denoise} onChange={setDenoise} /></div>
        <div className="mt-2"><SettingsToggle label="Sharpen" checked={sharpen} onChange={setSharpen} /></div>
        <div className="mt-2"><SettingsSlider label="Brightness" value={brightness} onChange={setBrightness} min={-50} max={50} /></div>
        <div className="mt-2"><SettingsSlider label="Contrast" value={contrast} onChange={setContrast} min={-50} max={50} /></div>
      </SettingsSection>
      <SettingsSection title="Metadata" icon={<HardDrive className="w-4 h-4" />}>
        <SettingsToggle label="Remove EXIF" description="Strip metadata" checked={removeExif} onChange={setRemoveExif} />
        {!removeExif && <div className="mt-2"><SettingsToggle label="Keep GPS data" checked={keepGps} onChange={setKeepGps} /></div>}
      </SettingsSection>
      <SettingsSection title="Color Profile" icon={<Palette className="w-4 h-4" />}>
        <SettingsSelect label="Profile" options={COLOR_PROFILES} value={colorProfile} onChange={setColorProfile} />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout toolName="Image Compressor" toolIcon={<Zap className="w-5 h-5 text-white" />} toolColor="from-emerald-500 to-teal-500" settingsPanel={settingsPanel}
      actionButton={{ label: 'Compress Image', onClick: handleCompress, disabled: !file, loading: processing, loadingText: `Compressing... ${progress}%`, icon: <Minimize2 className="w-5 h-5" /> }}>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <FileDropzone files={file ? [file] : []} onFilesChange={handleFilesChange} accept="image/*" multiple={false} title="Drop any image here" description="JPG, PNG, WebP, GIF supported" icon={<Image className="w-8 h-8" />} accentColor="green" disabled={processing} />
          {file && preview && (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400"><Image className="w-6 h-6" /></div>
                  <div><p className="font-medium text-white">{file.name}</p><p className="text-sm text-white/40">{formatSize(file.size)} • {detectedFormat.toUpperCase()}</p></div>
                </div>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
                <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</motion.div>}</AnimatePresence>
          {processing && <div className="space-y-2"><div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div><p className="text-xs text-white/40 text-center">Compressing...</p></div>}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-400" /></div>
            <h2 className="text-2xl font-bold text-white mb-2">Image Compressed!</h2>
            <p className="text-white/60">{result.name}</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="text-center"><p className="text-xs text-white/40">Original</p><p className="font-semibold text-white/60">{formatSize(result.originalSize)}</p></div>
              <div className="text-2xl text-emerald-400">→</div>
              <div className="text-center"><p className="text-xs text-white/40">Compressed</p><p className="font-semibold text-emerald-400">{formatSize(result.size)}</p></div>
              <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-sm">-{compressionRatio}%</div>
            </div>
          </motion.div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10"><img src={result.url} alt="Compressed" className="max-w-full mx-auto rounded-lg" /></div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Image</button>
            <button onClick={reset} className="px-8 py-4 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors">Compress Another</button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
