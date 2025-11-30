'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, Hash, Settings2, AlignCenter, AlignLeft, AlignRight
} from 'lucide-react';

const POSITIONS = [
  { id: 'bottom-center', label: 'Bottom Center', icon: AlignCenter },
  { id: 'bottom-left', label: 'Bottom Left', icon: AlignLeft },
  { id: 'bottom-right', label: 'Bottom Right', icon: AlignRight },
  { id: 'top-center', label: 'Top Center', icon: AlignCenter },
  { id: 'top-left', label: 'Top Left', icon: AlignLeft },
  { id: 'top-right', label: 'Top Right', icon: AlignRight },
];

const FORMATS = [
  { id: 'number', label: '1, 2, 3...', example: '1' },
  { id: 'page-of-total', label: 'Page X of Y', example: 'Page 1 of 10' },
  { id: 'roman', label: 'I, II, III...', example: 'I' },
];

export default function AddPageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [position, setPosition] = useState('bottom-center');
  const [formatStyle, setFormatStyle] = useState('number');
  const [startNumber, setStartNumber] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);

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
      formData.append('position', position);
      formData.append('formatStyle', formatStyle);
      formData.append('startNumber', String(startNumber));
      formData.append('skipFirst', String(skipFirst));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 4, 90));
      }, 200);

      const response = await fetch('/api/tools/add-page-numbers', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Failed to add page numbers');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace('.pdf', '-numbered.pdf'), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to add page numbers');
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
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-violet-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              PDF TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Add Page Numbers</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Add professional page numbers to your PDF documents with customizable position and style.
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
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-indigo-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your PDF here</h3>
                  <p className="text-zinc-500">or click to browse • PDF files only</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
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

            {/* Settings */}
            {file && (
              <>
                {/* Position Selector with Visual Preview */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-amber-400" />
                    Position
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {POSITIONS.map(pos => {
                      const Icon = pos.icon;
                      return (
                        <button
                          key={pos.id}
                          onClick={() => setPosition(pos.id)}
                          className={`p-4 rounded-xl border text-center transition-all ${
                            position === pos.id
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-2" />
                          <span className="text-sm">{pos.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Format Style */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4">Number Format</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {FORMATS.map(fmt => (
                      <button
                        key={fmt.id}
                        onClick={() => setFormatStyle(fmt.id)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          formatStyle === fmt.id
                            ? 'bg-indigo-500/20 border-indigo-500/50'
                            : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                        }`}
                      >
                        <p className={`text-lg font-mono mb-1 ${formatStyle === fmt.id ? 'text-white' : 'text-zinc-400'}`}>
                          {fmt.example}
                        </p>
                        <p className="text-xs text-zinc-500">{fmt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                      Start Number
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={skipFirst}
                        onChange={(e) => setSkipFirst(e.target.checked)}
                        className="w-5 h-5 rounded border-zinc-600 text-indigo-500 focus:ring-indigo-500/20"
                      />
                      <div>
                        <p className="text-white font-medium">Skip First Page</p>
                        <p className="text-sm text-zinc-500">Don't number cover page</p>
                      </div>
                    </label>
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
                disabled={processing}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  processing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Adding Page Numbers... {progress}%
                  </>
                ) : (
                  <>
                    <Hash className="w-6 h-6" />
                    Add Page Numbers
                  </>
                )}
              </button>
            )}

            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
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
            <h2 className="text-2xl font-bold text-white">Page Numbers Added!</h2>
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
                Number Another PDF
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
