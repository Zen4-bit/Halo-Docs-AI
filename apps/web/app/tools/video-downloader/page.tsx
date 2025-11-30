'use client';

import { useState } from 'react';
import { getToolById } from '@/config/toolsList';
import ToolLayout from '@/components/tools/ToolLayout';
import { Download, Loader2, Link as LinkIcon, Video, Music } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

export default function VideoDownloaderPage() {
  const tool = getToolById('video-downloader');
  const [url, setUrl] = useState('');
  const [resolution, setResolution] = useState('720p');
  const [format, setFormat] = useState('mp4');
  const [audioOnly, setAudioOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  if (!tool) return <div>Tool not found</div>;

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/tools/video-downloader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          resolution,
          format: audioOnly ? 'mp3' : format,
          audioOnly
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.detail || 'Download failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setResult(null);
    setError('');
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!result ? (
          <>
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Video URL
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Supports: YouTube, Vimeo, Facebook, Twitter, Instagram, and more
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Resolution */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Resolution
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  disabled={audioOnly}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="360p">360p</option>
                  <option value="480p">480p</option>
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="1440p">1440p (2K)</option>
                  <option value="2160p">2160p (4K)</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Format
                </label>
                <select
                  value={audioOnly ? 'mp3' : format}
                  onChange={(e) => setFormat(e.target.value)}
                  disabled={audioOnly}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                </select>
              </div>

              {/* Audio Only Toggle */}
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full">
                  <input
                    type="checkbox"
                    checked={audioOnly}
                    onChange={(e) => setAudioOnly(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Audio Only (MP3)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={loading || !url.trim()}
              className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  Download {audioOnly ? 'Audio' : 'Video'}
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Result */}
            <div className="p-6 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  {audioOnly ? <Music className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Download Ready!</h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {result.title || 'Your file is ready for download'}
                  </p>
                </div>
              </div>
              
              {result.downloadUrl && (
                <a
                  href={result.downloadUrl}
                  download
                  className="mt-4 w-full py-3 px-6 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download File
                </a>
              )}
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-all"
            >
              Download Another Video
            </button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
