'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, Image, Maximize2, Link2, Link2Off, Eye, Percent
} from 'lucide-react';

const PRESETS = [
  { id: 'custom', label: 'Custom', width: 0, height: 0 },
  { id: 'hd', label: 'HD (1280×720)', width: 1280, height: 720 },
  { id: 'fhd', label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
  { id: '4k', label: '4K (3840×2160)', width: 3840, height: 2160 },
  { id: 'instagram', label: 'Instagram (1080×1080)', width: 1080, height: 1080 },
  { id: 'twitter', label: 'Twitter (1200×675)', width: 1200, height: 675 },
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setError(null);
    } else {
      setError('Please upload an image file');
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    } else {
      setError('Please upload an image file');
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

  const handleResize = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('width', String(width));
      formData.append('height', String(height));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      const response = await fetch('/api/tools/image-resizer', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Resize failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace(/(\.[^.]+)$/, '-resized$1'), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to resize image');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
              <Maximize2 className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              IMAGE TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Image Resizer</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Resize images to exact dimensions with presets for social media and common sizes.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!result ? (
          <div className="space-y-8">
            {/* Upload Zone */}
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative border-2 border-dashed border-zinc-700 hover:border-indigo-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-indigo-500/5 group"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-indigo-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your image here</h3>
                  <p className="text-zinc-500">or click to browse</p>
                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                    {['PNG', 'JPG', 'WebP', 'GIF'].map(fmt => (
                      <span key={fmt} className="px-3 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-400">.{fmt}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Preview */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-4 text-sm text-zinc-400">
                      <Eye className="w-4 h-4" />
                      Preview
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center">
                      {preview && <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                        <Image className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white truncate">{file.name}</p>
                        <p className="text-sm text-zinc-500">
                          Original: {originalDimensions.width} × {originalDimensions.height}px
                        </p>
                      </div>
                      <button onClick={reset} className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                      <p className="text-sm text-zinc-400 mb-2">New dimensions</p>
                      <p className="text-2xl font-bold text-white">{width} × {height}px</p>
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4">Quick Presets</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handlePresetChange(p.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          preset === p.id
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-sm font-medium">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resize Mode Toggle */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={() => setResizeMode('pixels')}
                      className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                        resizeMode === 'pixels'
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <Maximize2 className="w-5 h-5 mx-auto mb-2" />
                      <span className="font-medium">By Pixels</span>
                    </button>
                    <button
                      onClick={() => setResizeMode('percentage')}
                      className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                        resizeMode === 'percentage'
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <Percent className="w-5 h-5 mx-auto mb-2" />
                      <span className="font-medium">By Percentage</span>
                    </button>
                  </div>

                  {resizeMode === 'pixels' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">Width (px)</label>
                          <input
                            type="number"
                            value={width}
                            onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => setLockAspectRatio(!lockAspectRatio)}
                          className={`mt-6 p-3 rounded-xl border transition-all ${
                            lockAspectRatio
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'
                          }`}
                        >
                          {lockAspectRatio ? <Link2 className="w-5 h-5" /> : <Link2Off className="w-5 h-5" />}
                        </button>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">Height (px)</label>
                          <input
                            type="number"
                            value={height}
                            onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-3">Scale: {percentage}%</label>
                      <input
                        type="range"
                        min={10}
                        max={200}
                        value={percentage}
                        onChange={(e) => handlePercentageChange(parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                      <div className="flex justify-between text-xs text-zinc-500 mt-2">
                        <span>10%</span>
                        <span>100%</span>
                        <span>200%</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {file && (
              <button
                onClick={handleResize}
                disabled={processing || width <= 0 || height <= 0}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  processing || width <= 0 || height <= 0
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Resizing... {progress}%
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-6 h-6" />
                    Resize Image
                  </>
                )}
              </button>
            )}

            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6">
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Image Resized!</h2>
              <p className="text-zinc-400">{result.name} • {formatSize(result.size)}</p>
              <p className="text-zinc-500 text-sm mt-1">New size: {width} × {height}px</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <img src={result.url} alt="Resized" className="max-w-full mx-auto rounded-lg" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download Resized Image
              </button>
              <button onClick={reset} className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors">
                Resize Another Image
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
