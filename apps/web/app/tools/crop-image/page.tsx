'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, Crop, Move, Square, RectangleHorizontal, Circle, Ratio
} from 'lucide-react';

const ASPECT_RATIOS = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: 'Square', ratio: 1 },
  { id: '16:9', label: '16:9', ratio: 16/9 },
  { id: '4:3', label: '4:3', ratio: 4/3 },
  { id: '3:2', label: '3:2', ratio: 3/2 },
  { id: '9:16', label: '9:16', ratio: 9/16 },
];

export default function CropImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [aspectRatio, setAspectRatio] = useState<string>('free');
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith('image/')) {
      setFile(droppedFile);
      const url = URL.createObjectURL(droppedFile);
      setPreview(url);
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
    if (preview && imageRef.current) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        const containerWidth = containerRef.current?.clientWidth || 400;
        const initialSize = Math.min(containerWidth * 0.5, 200);
        setCropArea({ x: 50, y: 50, width: initialSize, height: initialSize });
      };
      img.src = preview;
    }
  }, [preview]);

  const handleCrop = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('x', String(Math.round(cropArea.x)));
      formData.append('y', String(Math.round(cropArea.y)));
      formData.append('width', String(Math.round(cropArea.width)));
      formData.append('height', String(Math.round(cropArea.height)));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      const response = await fetch('/api/tools/crop-image', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Crop failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace(/(\.[^.]+)$/, '-cropped$1'), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to crop image');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-blue-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
              <Crop className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">
              IMAGE TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Crop Image</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Select and crop any part of your image with precise controls and aspect ratio presets.
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
                className="relative border-2 border-dashed border-zinc-700 hover:border-teal-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-teal-500/5 group"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-teal-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your image here</h3>
                  <p className="text-zinc-500">or click to browse</p>
                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                    {['PNG', 'JPG', 'WebP', 'GIF'].map(fmt => (
                      <span key={fmt} className="px-3 py-1 rounded-full text-xs bg-teal-500/20 text-teal-400">.{fmt}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Crop Canvas */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Move className="w-4 h-4" />
                      Drag to reposition • Resize from corners
                    </div>
                    <button onClick={reset} className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div 
                    ref={containerRef}
                    className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center"
                  >
                    {preview && (
                      <img 
                        ref={imageRef}
                        src={preview} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                    
                    {/* Crop Overlay */}
                    <div className="absolute inset-0 bg-black/50">
                      <div
                        className="absolute border-2 border-teal-400 bg-transparent shadow-lg cursor-move"
                        style={{
                          left: cropArea.x,
                          top: cropArea.y,
                          width: cropArea.width,
                          height: cropArea.height,
                        }}
                      >
                        {/* Clear area inside crop */}
                        <div className="absolute inset-0 bg-[rgba(255,255,255,0.1)]" />
                        
                        {/* Grid lines */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="border border-white/20" />
                          ))}
                        </div>
                        
                        {/* Corner handles */}
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
                          <div
                            key={corner}
                            className={`absolute w-4 h-4 bg-teal-400 border-2 border-white rounded-sm cursor-${corner.includes('left') ? (corner.includes('top') ? 'nw' : 'sw') : (corner.includes('top') ? 'ne' : 'se')}-resize
                              ${corner.includes('top') ? '-top-2' : '-bottom-2'}
                              ${corner.includes('left') ? '-left-2' : '-right-2'}
                            `}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Dimensions display */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm text-zinc-400">
                    <span>Selection: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px</span>
                  </div>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Ratio className="w-5 h-5 text-amber-400" />
                    Aspect Ratio
                  </h3>
                  <div className="grid grid-cols-6 gap-3">
                    {ASPECT_RATIOS.map(ratio => (
                      <button
                        key={ratio.id}
                        onClick={() => {
                          setAspectRatio(ratio.id);
                          if (ratio.ratio) {
                            const newHeight = cropArea.width / ratio.ratio;
                            setCropArea(prev => ({ ...prev, height: newHeight }));
                          }
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          aspectRatio === ratio.id
                            ? 'bg-teal-500/20 border-teal-500/50 text-white'
                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-sm font-medium">{ratio.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Width (px)</label>
                    <input
                      type="number"
                      value={Math.round(cropArea.width)}
                      onChange={(e) => setCropArea(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Height (px)</label>
                    <input
                      type="number"
                      value={Math.round(cropArea.height)}
                      onChange={(e) => setCropArea(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-teal-500 focus:outline-none"
                    />
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
                onClick={handleCrop}
                disabled={processing}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  processing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Cropping... {progress}%
                  </>
                ) : (
                  <>
                    <Crop className="w-6 h-6" />
                    Crop Image
                  </>
                )}
              </button>
            )}

            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6">
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Image Cropped!</h2>
              <p className="text-zinc-400">{result.name} • {formatSize(result.size)}</p>
            </div>

            {/* Preview result */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <img src={result.url} alt="Cropped" className="max-w-full mx-auto rounded-lg" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download Cropped Image
              </button>
              <button onClick={reset} className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors">
                Crop Another Image
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
