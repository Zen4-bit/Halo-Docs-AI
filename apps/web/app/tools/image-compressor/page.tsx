'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, Image, Minimize2, Eye, Sliders, Sparkles, FileImage, Zap
} from 'lucide-react';

type ImageFormat = 'auto' | 'jpeg' | 'png' | 'webp';

export default function ImageCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number; originalSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [quality, setQuality] = useState(80);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('auto');
  const [preserveMetadata, setPreserveMetadata] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<string>('');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith('image/')) {
      handleFile(droppedFile);
    } else {
      setError('Please upload an image file');
    }
  }, []);

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
    // Detect format
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    setDetectedFormat(ext);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type.startsWith('image/')) {
      handleFile(selectedFile);
    } else {
      setError('Please upload an image file');
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
      formData.append('quality', String(quality));
      formData.append('outputFormat', outputFormat);
      formData.append('preserveMetadata', String(preserveMetadata));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      const response = await fetch('/api/tools/image-compressor', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Compression failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const ext = outputFormat === 'auto' ? detectedFormat : outputFormat;
      setResult({ 
        url, 
        name: file.name.replace(/\.[^.]+$/, `-compressed.${ext}`), 
        size: blob.size,
        originalSize: file.size 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to compress image');
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

  const compressionRatio = result ? Math.round((1 - result.size / result.originalSize) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              UNIVERSAL TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Image Compressor</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Auto-detect and compress any image format. Supports JPG, PNG, WebP, and GIF with intelligent optimization.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!result ? (
          <div className="space-y-8">
            {!file ? (
              <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="relative border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-emerald-500/5 group">
                <input type="file" accept="image/*" onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-emerald-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop any image here</h3>
                  <p className="text-zinc-500">or click to browse</p>
                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">.JPG</span>
                    <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">.PNG</span>
                    <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">.WebP</span>
                    <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">.GIF</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-4 text-sm text-zinc-400"><Eye className="w-4 h-4" />Preview</div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center">
                      {preview && <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400"><FileImage className="w-6 h-6" /></div>
                      <div className="flex-1">
                        <p className="font-medium text-white truncate">{file.name}</p>
                        <p className="text-sm text-zinc-500">Original: {formatSize(file.size)}</p>
                      </div>
                      <button onClick={reset} className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                      <p className="text-sm text-zinc-400 mb-2">Detected Format</p>
                      <p className="text-2xl font-bold text-white uppercase">{detectedFormat}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Sliders className="w-5 h-5 text-amber-400" />Quality: {quality}%</h3>
                  <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full accent-emerald-500" />
                  <div className="flex justify-between mt-2 text-xs text-zinc-500">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" />Output Format</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {(['auto', 'jpeg', 'png', 'webp'] as ImageFormat[]).map(format => (
                      <button key={format} onClick={() => setOutputFormat(format)} className={`p-3 rounded-xl border text-center transition-all ${outputFormat === format ? 'bg-emerald-500/20 border-emerald-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'}`}>
                        <span className="text-sm font-medium uppercase">{format === 'auto' ? 'Auto' : format}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 cursor-pointer">
                  <input type="checkbox" checked={preserveMetadata} onChange={(e) => setPreserveMetadata(e.target.checked)} className="w-5 h-5 rounded border-zinc-600 text-emerald-500" />
                  <div>
                    <p className="text-white font-medium">Preserve Metadata</p>
                    <p className="text-sm text-zinc-500">Keep EXIF data and other metadata</p>
                  </div>
                </label>
              </>
            )}

            {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400"><AlertCircle className="w-5 h-5" /><p>{error}</p></div>}

            {file && (
              <button onClick={handleCompress} disabled={processing} className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${processing ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'}`}>
                {processing ? <><Loader2 className="w-6 h-6 animate-spin" />Compressing... {progress}%</> : <><Minimize2 className="w-6 h-6" />Compress Image</>}
              </button>
            )}

            {processing && <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300" style={{ width: `${progress}%` }} /></div>}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-400" /></div>
              <h2 className="text-2xl font-bold text-white mb-2">Image Compressed!</h2>
              <p className="text-zinc-400">{result.name}</p>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-zinc-500">Original</p>
                  <p className="text-lg font-semibold text-zinc-300">{formatSize(result.originalSize)}</p>
                </div>
                <div className="text-3xl text-emerald-400">→</div>
                <div className="text-center">
                  <p className="text-sm text-zinc-500">Compressed</p>
                  <p className="text-lg font-semibold text-emerald-400">{formatSize(result.size)}</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                  -{compressionRatio}%
                </div>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800"><img src={result.url} alt="Compressed" className="max-w-full mx-auto rounded-lg" /></div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Compressed Image</button>
              <button onClick={reset} className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors">Compress Another Image</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
