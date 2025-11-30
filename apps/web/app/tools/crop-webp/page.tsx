'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, Crop, Ratio, Eye, Sliders, Sparkles
} from 'lucide-react';

const ASPECT_RATIOS = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: 'Square', ratio: 1 },
  { id: '16:9', label: '16:9', ratio: 16/9 },
  { id: '4:3', label: '4:3', ratio: 4/3 },
];

export default function CropWebPPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [aspectRatio, setAspectRatio] = useState<string>('free');
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [quality, setQuality] = useState(90);
  const [lossless, setLossless] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.match(/\.webp$/i)) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setError(null);
    } else {
      setError('Please upload a WebP image');
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.name.match(/\.webp$/i)) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    } else {
      setError('Please upload a WebP image');
    }
  };

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
      formData.append('quality', String(quality));
      formData.append('lossless', String(lossless));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      const response = await fetch('/api/tools/crop-webp', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Crop failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace('.webp', '-cropped.webp'), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to crop WebP');
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
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30">
              WEBP TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Crop WebP</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Crop WebP images with lossy or lossless output options.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!result ? (
          <div className="space-y-8">
            {!file ? (
              <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="relative border-2 border-dashed border-zinc-700 hover:border-violet-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-violet-500/5 group">
                <input type="file" accept=".webp" onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-violet-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your WebP here</h3>
                  <p className="text-zinc-500">or click to browse</p>
                  <span className="mt-4 inline-block px-3 py-1 rounded-full text-xs bg-violet-500/20 text-violet-400">.WEBP</span>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400"><Eye className="w-4 h-4" />Preview</div>
                    <button onClick={reset} className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center">
                    {preview && <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />}
                    <div className="absolute inset-0 bg-black/50">
                      <div className="absolute border-2 border-violet-400 bg-transparent shadow-lg" style={{ left: cropArea.x, top: cropArea.y, width: cropArea.width, height: cropArea.height }}>
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">{[...Array(9)].map((_, i) => <div key={i} className="border border-white/20" />)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Ratio className="w-5 h-5 text-amber-400" />Aspect Ratio</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {ASPECT_RATIOS.map(ratio => (
                      <button key={ratio.id} onClick={() => { setAspectRatio(ratio.id); if (ratio.ratio) setCropArea(prev => ({ ...prev, height: prev.width / ratio.ratio! })); }} className={`p-3 rounded-xl border text-center transition-all ${aspectRatio === ratio.id ? 'bg-violet-500/20 border-violet-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'}`}>
                        <span className="text-sm font-medium">{ratio.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Sliders className="w-5 h-5 text-amber-400" />Quality: {lossless ? 'Lossless' : `${quality}%`}</h3>
                  <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} disabled={lossless} className={`w-full accent-violet-500 ${lossless ? 'opacity-50' : ''}`} />
                  <label className="mt-4 flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={lossless} onChange={(e) => setLossless(e.target.checked)} className="w-5 h-5 rounded border-zinc-600 text-violet-500" />
                    <span className="text-white">Lossless output</span>
                  </label>
                </div>
              </>
            )}

            {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400"><AlertCircle className="w-5 h-5" /><p>{error}</p></div>}

            {file && (
              <button onClick={handleCrop} disabled={processing} className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${processing ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98]'}`}>
                {processing ? <><Loader2 className="w-6 h-6 animate-spin" />Cropping... {progress}%</> : <><Crop className="w-6 h-6" />Crop WebP</>}
              </button>
            )}

            {processing && <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300" style={{ width: `${progress}%` }} /></div>}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-400" /></div>
              <h2 className="text-2xl font-bold text-white mb-2">WebP Cropped!</h2>
              <p className="text-zinc-400">{result.name} • {formatSize(result.size)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800"><img src={result.url} alt="Cropped" className="max-w-full mx-auto rounded-lg" /></div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Cropped WebP</button>
              <button onClick={reset} className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors">Crop Another WebP</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
