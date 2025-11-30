'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, Image, Settings2, Monitor
} from 'lucide-react';

const IMAGE_FORMATS = [
  { id: 'png', label: 'PNG', desc: 'Lossless quality' },
  { id: 'jpg', label: 'JPG', desc: 'Smaller file size' },
  { id: 'webp', label: 'WebP', desc: 'Modern format' },
];

const DPI_OPTIONS = [
  { value: 72, label: 'Screen (72 DPI)' },
  { value: 150, label: 'Standard (150 DPI)' },
  { value: 300, label: 'Print (300 DPI)' },
  { value: 600, label: 'High Quality (600 DPI)' },
];

export default function PDFToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [outputFormat, setOutputFormat] = useState('png');
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(90);

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

  const handleConvert = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outputFormat', outputFormat);
      formData.append('dpi', String(dpi));
      formData.append('quality', String(quality));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 3, 90));
      }, 200);

      const response = await fetch('/api/tools/pdf-to-image', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Conversion failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace('.pdf', `.${outputFormat}`), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to convert PDF');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-fuchsia-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/25">
              <Image className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              CONVERTER
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">PDF to Image</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Convert PDF pages to high-quality images. Choose resolution and format.
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
                className="relative border-2 border-dashed border-zinc-700 hover:border-purple-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-purple-500/5 group"
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-purple-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your PDF here</h3>
                  <p className="text-zinc-500">or click to browse • PDF files only</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-zinc-500">{formatSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-zinc-400">→</span>
                  <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                    <Image className="w-6 h-6" />
                  </div>
                  <span className="text-purple-400 font-medium">.{outputFormat.toUpperCase()}</span>
                  <button
                    onClick={reset}
                    className="ml-4 p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Options */}
            {file && (
              <>
                {/* Format Selection */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-amber-400" />
                    Output Format
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {IMAGE_FORMATS.map(format => (
                      <button
                        key={format.id}
                        onClick={() => setOutputFormat(format.id)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          outputFormat === format.id
                            ? 'bg-purple-500/20 border-purple-500/50 text-white'
                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <p className="font-semibold">{format.label}</p>
                        <p className="text-sm opacity-70">{format.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution & Quality */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-6">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-amber-400" />
                    Resolution & Quality
                  </h3>

                  {/* DPI Selection */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Resolution (DPI)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {DPI_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setDpi(option.value)}
                          className={`p-3 rounded-xl border text-sm transition-all ${
                            dpi === option.value
                              ? 'bg-purple-500/20 border-purple-500/50 text-white'
                              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality Slider */}
                  {outputFormat !== 'png' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-3">
                        Quality: {quality}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-zinc-500 mt-1">
                        <span>Smaller file</span>
                        <span>Better quality</span>
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
                onClick={handleConvert}
                disabled={processing}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  processing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Converting... {progress}%
                  </>
                ) : (
                  <>
                    <Image className="w-6 h-6" />
                    Convert to {outputFormat.toUpperCase()}
                  </>
                )}
              </button>
            )}

            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-6">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Conversion Complete!</h2>
            <p className="text-zinc-400">{result.name} • {formatSize(result.size)}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={handleDownload}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Images
              </button>
              <button
                onClick={reset}
                className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
              >
                Convert Another PDF
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
