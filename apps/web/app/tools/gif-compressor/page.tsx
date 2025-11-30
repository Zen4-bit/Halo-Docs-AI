'use client';

import { useState, useCallback } from 'react';
import { 
  Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, Film, Settings2, TrendingDown, Eye, Sliders, Palette, Zap
} from 'lucide-react';

export default function GIFCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; originalSize: number; compressedSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [colorReduction, setColorReduction] = useState(128);
  const [lossy, setLossy] = useState(80);
  const [reduceFrames, setReduceFrames] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'image/gif') {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setError(null);
    } else {
      setError('Please upload a GIF image');
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'image/gif') {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    } else {
      setError('Please upload a GIF image');
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('colorReduction', String(colorReduction));
      formData.append('lossy', String(lossy));
      formData.append('reduceFrames', String(reduceFrames));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 200);

      const response = await fetch('/api/tools/gif-compressor', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Compression failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace('.gif', '-compressed.gif'), originalSize: file.size, compressedSize: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to compress GIF');
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
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const compressionRatio = result ? Math.round((1 - result.compressedSize / result.originalSize) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/25">
              <Film className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-400 border border-pink-500/30">
              IMAGE TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">GIF Compressor</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Reduce animated GIF file size while preserving animation quality.
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
                className="relative border-2 border-dashed border-zinc-700 hover:border-pink-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-pink-500/5 group"
              >
                <input
                  type="file"
                  accept=".gif"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-pink-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-pink-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your GIF here</h3>
                  <p className="text-zinc-500">or click to browse</p>
                  <span className="mt-4 inline-block px-3 py-1 rounded-full text-xs bg-pink-500/20 text-pink-400">.GIF</span>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-4 text-sm text-zinc-400">
                    <Eye className="w-4 h-4" />
                    Preview (Animated)
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center">
                    {preview && <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-pink-500/20 text-pink-400">
                      <Film className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white truncate">{file.name}</p>
                      <p className="text-sm text-zinc-500">{formatSize(file.size)}</p>
                    </div>
                    <button onClick={reset} className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {file && (
              <>
                {/* Color Palette */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-amber-400" />
                    Color Palette: {colorReduction} colors
                  </h3>
                  <input
                    type="range"
                    min={16}
                    max={256}
                    step={16}
                    value={colorReduction}
                    onChange={(e) => setColorReduction(parseInt(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-2">
                    <span>16 colors (smaller)</span>
                    <span>256 colors (better quality)</span>
                  </div>
                </div>

                {/* Lossy Compression */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    Lossy Compression: {lossy}
                  </h3>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={lossy}
                    onChange={(e) => setLossy(parseInt(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-2">
                    <span>0 (lossless)</span>
                    <span>200 (max compression)</span>
                  </div>
                </div>

                {/* Frame Reduction */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reduceFrames}
                      onChange={(e) => setReduceFrames(e.target.checked)}
                      className="w-5 h-5 rounded border-zinc-600 text-pink-500 focus:ring-pink-500/20"
                    />
                    <div>
                      <p className="text-white font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-pink-400" />
                        Reduce Frame Count
                      </p>
                      <p className="text-sm text-zinc-500">Skip every other frame (may affect smoothness)</p>
                    </div>
                  </label>
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
                onClick={handleCompress}
                disabled={processing}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  processing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Compressing... {progress}%
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-6 h-6" />
                    Compress GIF
                  </>
                )}
              </button>
            )}

            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6">
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">GIF Compressed!</h2>
              <p className="text-zinc-400">Reduced by {compressionRatio}%</p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="grid sm:grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Original</p>
                  <p className="text-xl font-bold text-white">{formatSize(result.originalSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Compressed</p>
                  <p className="text-xl font-bold text-green-400">{formatSize(result.compressedSize)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download Compressed GIF
              </button>
              <button onClick={reset} className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors">
                Compress Another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
