'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Upload, Download, Loader2, CheckCircle2, AlertCircle,
  Settings2, Gauge, X, TrendingDown, Zap, Shield, HardDrive
} from 'lucide-react';

const COMPRESSION_LEVELS = [
  { id: 'low', label: 'Low', description: 'Minimal compression, best quality', reduction: '10-20%', icon: Shield },
  { id: 'medium', label: 'Medium', description: 'Balanced quality & size', reduction: '30-50%', icon: Gauge },
  { id: 'high', label: 'High', description: 'Maximum compression', reduction: '50-70%', icon: Zap },
];

export default function CompressPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; originalSize: number; compressedSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Compression options
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [grayscale, setGrayscale] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
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
      formData.append('quality', compressionLevel);
      formData.append('removeMetadata', String(removeMetadata));
      formData.append('grayscale', String(grayscale));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 3, 90));
      }, 150);

      const response = await fetch('/api/tools/compress-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Failed to compress PDF');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ 
        url, 
        name: file.name.replace('.pdf', '-compressed.pdf'), 
        originalSize: file.size,
        compressedSize: blob.size 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to compress PDF');
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
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 shadow-lg shadow-green-500/25">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
              PDF TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Compress PDF</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Reduce PDF file size while maintaining quality. Choose your compression level for optimal results.
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
                className="relative border-2 border-dashed border-zinc-700 hover:border-green-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-green-500/5 group"
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-green-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-green-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your PDF here</h3>
                  <p className="text-zinc-500">or click to browse • PDF files only</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/20 text-green-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-zinc-500">{formatSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Compression Level Selector */}
            {file && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-amber-400" />
                  Compression Level
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {COMPRESSION_LEVELS.map(level => {
                    const Icon = level.icon;
                    return (
                      <button
                        key={level.id}
                        onClick={() => setCompressionLevel(level.id)}
                        className={`p-5 rounded-xl border text-left transition-all ${
                          compressionLevel === level.id
                            ? 'bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/10'
                            : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                        }`}
                      >
                        <div className={`inline-flex p-2 rounded-lg mb-3 ${
                          compressionLevel === level.id ? 'bg-green-500/30 text-green-400' : 'bg-zinc-700/50 text-zinc-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className={`font-semibold mb-1 ${compressionLevel === level.id ? 'text-white' : 'text-zinc-300'}`}>
                          {level.label}
                        </h4>
                        <p className="text-sm text-zinc-500 mb-2">{level.description}</p>
                        <span className={`text-sm font-medium ${
                          compressionLevel === level.id ? 'text-green-400' : 'text-zinc-500'
                        }`}>
                          ~{level.reduction} reduction
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Additional Options */}
            {file && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-amber-400" />
                  Additional Options
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 cursor-pointer hover:border-zinc-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={removeMetadata}
                      onChange={(e) => setRemoveMetadata(e.target.checked)}
                      className="w-5 h-5 rounded border-zinc-600 text-green-500 focus:ring-green-500/20"
                    />
                    <div>
                      <p className="text-white font-medium">Remove Metadata</p>
                      <p className="text-sm text-zinc-500">Strip document properties</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 cursor-pointer hover:border-zinc-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={grayscale}
                      onChange={(e) => setGrayscale(e.target.checked)}
                      className="w-5 h-5 rounded border-zinc-600 text-green-500 focus:ring-green-500/20"
                    />
                    <div>
                      <p className="text-white font-medium">Convert to Grayscale</p>
                      <p className="text-sm text-zinc-500">Further reduce file size</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Compress Button */}
            {file && (
              <button
                onClick={handleCompress}
                disabled={processing}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  processing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98]'
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
                    Compress PDF
                  </>
                )}
              </button>
            )}

            {/* Progress */}
            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6">
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">PDF Compressed Successfully!</h2>
              <p className="text-zinc-400">Your file has been optimized</p>
            </div>

            {/* Size Comparison */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                <div>
                  <HardDrive className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500 mb-1">Original Size</p>
                  <p className="text-xl font-bold text-white">{formatSize(result.originalSize)}</p>
                </div>
                <div>
                  <TrendingDown className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500 mb-1">Compressed Size</p>
                  <p className="text-xl font-bold text-green-400">{formatSize(result.compressedSize)}</p>
                </div>
                <div>
                  <Zap className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500 mb-1">Reduction</p>
                  <p className="text-xl font-bold text-amber-400">{compressionRatio}%</p>
                </div>
              </div>
              
              {/* Visual Bar */}
              <div className="mt-6 pt-6 border-t border-zinc-700">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-500 w-20">Original</span>
                  <div className="flex-1 h-4 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-zinc-500 w-20">Compressed</span>
                  <div className="flex-1 h-4 bg-zinc-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-1000"
                      style={{ width: `${100 - compressionRatio}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Compressed PDF
              </button>
              <button
                onClick={reset}
                className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
              >
                Compress Another PDF
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
