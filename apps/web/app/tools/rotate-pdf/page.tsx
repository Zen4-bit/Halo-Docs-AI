'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, RotateCw, RotateCcw, FlipHorizontal
} from 'lucide-react';

const ROTATIONS = [
  { id: '90', label: '90°', icon: RotateCw, direction: 'Clockwise' },
  { id: '180', label: '180°', icon: FlipHorizontal, direction: 'Flip' },
  { id: '270', label: '270°', icon: RotateCcw, direction: 'Counter-clockwise' },
];

const PAGE_OPTIONS = [
  { id: 'all', label: 'All Pages' },
  { id: 'odd', label: 'Odd Pages' },
  { id: 'even', label: 'Even Pages' },
  { id: 'range', label: 'Custom Range' },
];

export default function RotatePDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [rotation, setRotation] = useState('90');
  const [pageSelection, setPageSelection] = useState('all');
  const [customRange, setCustomRange] = useState('');

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
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('rotation', rotation);
      formData.append('pages', pageSelection === 'range' ? customRange : pageSelection);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 4, 90));
      }, 200);

      const response = await fetch('/api/tools/rotate-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Failed to rotate PDF');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace('.pdf', '-rotated.pdf'), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to rotate PDF');
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
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/25">
              <RotateCw className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-400 border border-pink-500/30">
              PDF TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Rotate PDF</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Rotate PDF pages to any angle. Fix orientation issues or create landscape layouts.
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
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-pink-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-pink-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your PDF here</h3>
                  <p className="text-zinc-500">or click to browse • PDF files only</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-pink-500/20 text-pink-400">
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

            {/* Rotation Selection with Visual Preview */}
            {file && (
              <>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-6">Rotation Angle</h3>
                  <div className="grid grid-cols-3 gap-6">
                    {ROTATIONS.map(rot => {
                      const Icon = rot.icon;
                      return (
                        <button
                          key={rot.id}
                          onClick={() => setRotation(rot.id)}
                          className={`p-6 rounded-2xl border text-center transition-all ${
                            rotation === rot.id
                              ? 'bg-pink-500/20 border-pink-500/50 shadow-lg shadow-pink-500/10'
                              : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                          }`}
                        >
                          {/* Visual Preview */}
                          <div className="relative w-20 h-24 mx-auto mb-4 bg-white rounded shadow-lg overflow-hidden">
                            <div 
                              className="absolute inset-1 border-2 border-gray-300 rounded transition-transform duration-300"
                              style={{ transform: `rotate(${rot.id}deg)` }}
                            >
                              <div className="w-full h-2 bg-gray-200 mt-1" />
                              <div className="w-3/4 h-1 bg-gray-200 mt-1 ml-1" />
                              <div className="w-1/2 h-1 bg-gray-200 mt-1 ml-1" />
                            </div>
                          </div>
                          <Icon className={`w-8 h-8 mx-auto mb-2 ${rotation === rot.id ? 'text-pink-400' : 'text-zinc-400'}`} />
                          <p className={`text-xl font-bold ${rotation === rot.id ? 'text-white' : 'text-zinc-300'}`}>
                            {rot.label}
                          </p>
                          <p className="text-sm text-zinc-500">{rot.direction}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Page Selection */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4">Pages to Rotate</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PAGE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setPageSelection(opt.id)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          pageSelection === opt.id
                            ? 'bg-pink-500/20 border-pink-500/50 text-white'
                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  
                  {pageSelection === 'range' && (
                    <div className="mt-4">
                      <input
                        type="text"
                        value={customRange}
                        onChange={(e) => setCustomRange(e.target.value)}
                        placeholder="e.g., 1-5, 7, 9-12"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                      />
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
                onClick={handleProcess}
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
                    Rotating... {progress}%
                  </>
                ) : (
                  <>
                    <RotateCw className="w-6 h-6" />
                    Rotate PDF
                  </>
                )}
              </button>
            )}

            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300"
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
            <h2 className="text-2xl font-bold text-white">PDF Rotated Successfully!</h2>
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
                Rotate Another PDF
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
