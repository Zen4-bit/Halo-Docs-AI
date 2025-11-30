'use client';

import { useState, useCallback } from 'react';
import { 
  Upload, Download, Loader2, CheckCircle2, AlertCircle, Package,
  X, Image, Maximize2, Link2, Link2Off, Trash2
} from 'lucide-react';

interface FileItem {
  file: File;
  preview: string;
  id: string;
}

export default function BulkResizePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const newFiles = droppedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    const newFiles = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleBulkResize = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((item, index) => {
        formData.append(`files`, item.file);
      });
      formData.append('width', String(width));
      formData.append('height', String(height));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 200);

      const response = await fetch('/api/tools/bulk-resize', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Bulk resize failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: `resized-images-${Date.now()}.zip` });
    } catch (err: any) {
      setError(err.message || 'Failed to resize images');
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
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <Package className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              BATCH TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Bulk Resize</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Resize multiple images at once to the same dimensions. Download as a ZIP file.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!result ? (
          <div className="space-y-8">
            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative border-2 border-dashed border-zinc-700 hover:border-amber-500/50 rounded-2xl p-8 transition-all duration-300 bg-zinc-900/30 hover:bg-amber-500/5 group"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-amber-500/20 transition-colors mb-4">
                  <Upload className="w-10 h-10 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Drop multiple images here</h3>
                <p className="text-zinc-500">or click to browse • Supports PNG, JPG, WebP, GIF</p>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">{files.length} image{files.length > 1 ? 's' : ''} selected</h3>
                  <button
                    onClick={() => setFiles([])}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear all
                  </button>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {files.map(item => (
                    <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800">
                      <img src={item.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFile(item.id)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resize Options */}
            {files.length > 0 && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Maximize2 className="w-5 h-5 text-amber-400" />
                  Output Dimensions
                </h3>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Width (px)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className={`mt-6 p-3 rounded-xl border transition-all ${
                      lockAspectRatio
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
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
                      onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {files.length > 0 && (
              <button
                onClick={handleBulkResize}
                disabled={processing}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  processing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Resizing {files.length} images... {progress}%
                  </>
                ) : (
                  <>
                    <Package className="w-6 h-6" />
                    Resize {files.length} Images
                  </>
                )}
              </button>
            )}

            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6">
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Batch Resize Complete!</h2>
              <p className="text-zinc-400">{files.length} images resized to {width}×{height}px</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download ZIP
              </button>
              <button onClick={reset} className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors">
                Resize More Images
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
