'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, Droplet, Type, RotateCw, Eye, Palette
} from 'lucide-react';

const POSITIONS = [
  { id: 'center', label: 'Center' },
  { id: 'diagonal', label: 'Diagonal' },
  { id: 'header', label: 'Top' },
  { id: 'footer', label: 'Bottom' },
];

const COLORS = [
  { id: 'gray', label: 'Gray', class: 'bg-gray-400' },
  { id: 'red', label: 'Red', class: 'bg-red-500' },
  { id: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { id: 'black', label: 'Black', class: 'bg-black' },
];

export default function AddWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState('center');
  const [opacity, setOpacity] = useState(30);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('gray');
  const [rotation, setRotation] = useState(0);

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

  const handleProcess = async () => {
    if (!file || !watermarkText.trim()) {
      setError('Please provide a watermark text');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('watermarkText', watermarkText);
      formData.append('position', position);
      formData.append('opacity', String(opacity));
      formData.append('fontSize', String(fontSize));
      formData.append('color', color);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 4, 90));
      }, 200);

      const response = await fetch('/api/tools/add-watermark', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Failed to add watermark');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace('.pdf', '-watermarked.pdf'), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to add watermark');
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
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-cyan-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 shadow-lg shadow-sky-500/25">
              <Droplet className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
              PDF TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Add Watermark</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Add custom text watermarks to your PDF documents with full control over style and placement.
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
                className="relative border-2 border-dashed border-zinc-700 hover:border-sky-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-sky-500/5 group"
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-sky-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-sky-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your PDF here</h3>
                  <p className="text-zinc-500">or click to browse • PDF files only</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400">
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

            {/* Watermark Settings */}
            {file && (
              <>
                {/* Text Input */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5 text-amber-400" />
                    Watermark Text
                  </h3>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter watermark text..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-lg placeholder-zinc-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                {/* Preview */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-amber-400" />
                    Preview
                  </h3>
                  <div className="relative aspect-[3/4] max-w-xs mx-auto bg-white rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className={`font-bold text-center whitespace-nowrap ${
                          position === 'diagonal' ? '-rotate-45' : ''
                        }`}
                        style={{
                          fontSize: `${fontSize / 3}px`,
                          color: color === 'gray' ? '#9ca3af' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#000',
                          opacity: opacity / 100,
                        }}
                      >
                        {watermarkText || 'WATERMARK'}
                      </span>
                    </div>
                    <div className="absolute inset-4 border-2 border-dashed border-gray-300 rounded" />
                  </div>
                </div>

                {/* Position */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4">Position</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {POSITIONS.map(pos => (
                      <button
                        key={pos.id}
                        onClick={() => setPosition(pos.id)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          position === pos.id
                            ? 'bg-sky-500/20 border-sky-500/50 text-white'
                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                      Opacity: {opacity}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={opacity}
                      onChange={(e) => setOpacity(parseInt(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                      Font Size: {fontSize}px
                    </label>
                    <input
                      type="range"
                      min={12}
                      max={200}
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>

                {/* Color */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-amber-400" />
                    Color
                  </h3>
                  <div className="flex gap-4">
                    {COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setColor(c.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                          color === c.id
                            ? 'bg-sky-500/20 border-sky-500/50'
                            : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full ${c.class}`} />
                        <span className={color === c.id ? 'text-white' : 'text-zinc-400'}>{c.label}</span>
                      </button>
                    ))}
                  </div>
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
                onClick={handleProcess}
                disabled={processing || !watermarkText.trim()}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  processing || !watermarkText.trim()
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:shadow-lg hover:shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Adding Watermark... {progress}%
                  </>
                ) : (
                  <>
                    <Droplet className="w-6 h-6" />
                    Add Watermark
                  </>
                )}
              </button>
            )}

            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-300"
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
            <h2 className="text-2xl font-bold text-white">Watermark Added Successfully!</h2>
            <p className="text-zinc-400">{result.name} • {formatSize(result.size)}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={handleDownload}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={reset}
                className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
              >
                Add Another Watermark
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
