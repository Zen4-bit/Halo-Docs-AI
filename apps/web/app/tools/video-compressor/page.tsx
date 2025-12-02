'use client';

import { useState, useRef } from 'react';
import { 
  Download, CheckCircle2, Video, TrendingDown,
  HardDrive, Zap, Settings2, Film, Volume2, VolumeX,
  Play, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider,
  SettingsSelect,
  SettingsInput
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

export default function VideoCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; originalSize: number; compressedSize: number; duration?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Quality settings
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [targetBitrate, setTargetBitrate] = useState(2500);
  const [fps, setFps] = useState<'original' | '30' | '24' | '60'>('original');
  
  // Resolution
  const [resolution, setResolution] = useState<'original' | '1080p' | '720p' | '480p' | '360p'>('original');
  
  // Audio
  const [audioQuality, setAudioQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [removeAudio, setRemoveAudio] = useState(false);
  
  // Format
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'webm' | 'avi'>('mp4');
  const [fastStart, setFastStart] = useState(true);

  const handleFilesChange = (files: File[]) => {
    const selectedFile = files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
      setResult(null);
    } else {
      setFile(null);
      setPreview(null);
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
      formData.append('quality', quality);
      formData.append('targetBitrate', String(targetBitrate));
      formData.append('fps', fps);
      formData.append('resolution', resolution);
      formData.append('audioQuality', audioQuality);
      formData.append('removeAudio', String(removeAudio));
      formData.append('outputFormat', outputFormat);
      formData.append('fastStart', String(fastStart));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 500);

      const response = await fetch('/api/tools/video-compressor', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Compression failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const ext = outputFormat === 'mp4' ? 'mp4' : outputFormat === 'webm' ? 'webm' : 'avi';
      setResult({ 
        url, 
        name: file.name.replace(/\.[^/.]+$/, `-compressed.${ext}`), 
        originalSize: file.size, 
        compressedSize: blob.size 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to compress video');
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
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
  };

  const compressionRatio = result ? Math.round((1 - result.compressedSize / result.originalSize) * 100) : 0;

  const getEstimatedReduction = () => {
    let reduction = 0;
    if (quality === 'low') reduction += 60;
    else if (quality === 'medium') reduction += 40;
    else reduction += 20;
    
    if (resolution !== 'original') reduction += 10;
    if (removeAudio) reduction += 10;
    
    return Math.min(reduction, 80);
  };

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Quality */}
      <SettingsSection title="Quality" icon={<Settings2 className="w-4 h-4" />}>
        <SettingsSelect
          label="Compression preset"
          value={quality}
          onChange={(v) => setQuality(v as typeof quality)}
          options={[
            { value: 'high', label: 'High Quality (larger file)' },
            { value: 'medium', label: 'Balanced (recommended)' },
            { value: 'low', label: 'Maximum Compression (smaller)' },
          ]}
          icon={<Zap className="w-3 h-3" />}
        />
        
        <div className="mt-3">
          <SettingsSlider
            label="Target bitrate"
            value={targetBitrate}
            onChange={setTargetBitrate}
            min={500}
            max={8000}
            step={100}
            unit=" kbps"
          />
        </div>
        
        <div className="mt-3">
          <SettingsSelect
            label="Frame rate"
            value={fps}
            onChange={(v) => setFps(v as typeof fps)}
            options={[
              { value: 'original', label: 'Keep original' },
              { value: '60', label: '60 FPS' },
              { value: '30', label: '30 FPS' },
              { value: '24', label: '24 FPS (cinematic)' },
            ]}
            icon={<Film className="w-3 h-3" />}
          />
        </div>
      </SettingsSection>

      {/* Resolution */}
      <SettingsSection title="Resolution" icon={<Play className="w-4 h-4" />}>
        <SettingsSelect
          label="Output resolution"
          value={resolution}
          onChange={(v) => setResolution(v as typeof resolution)}
          options={[
            { value: 'original', label: 'Keep original' },
            { value: '1080p', label: '1080p (Full HD)' },
            { value: '720p', label: '720p (HD)' },
            { value: '480p', label: '480p (SD)' },
            { value: '360p', label: '360p (Mobile)' },
          ]}
        />
      </SettingsSection>

      {/* Audio */}
      <SettingsSection title="Audio" icon={<Volume2 className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Remove audio track"
          description="Create a silent video"
          checked={removeAudio}
          onChange={setRemoveAudio}
          icon={<VolumeX className="w-3 h-3" />}
        />
        
        {!removeAudio && (
          <div className="mt-3">
            <SettingsSelect
              label="Audio quality"
              value={audioQuality}
              onChange={(v) => setAudioQuality(v as typeof audioQuality)}
              options={[
                { value: 'high', label: 'High (192 kbps)' },
                { value: 'medium', label: 'Medium (128 kbps)' },
                { value: 'low', label: 'Low (64 kbps)' },
              ]}
            />
          </div>
        )}
      </SettingsSection>

      {/* Output */}
      <SettingsSection title="Output" icon={<Video className="w-4 h-4" />} defaultOpen={false}>
        <SettingsSelect
          label="Output format"
          value={outputFormat}
          onChange={(v) => setOutputFormat(v as typeof outputFormat)}
          options={[
            { value: 'mp4', label: 'MP4 (recommended)' },
            { value: 'webm', label: 'WebM (web optimized)' },
            { value: 'avi', label: 'AVI (legacy)' },
          ]}
        />
        
        <SettingsToggle
          label="Fast start (web playback)"
          description="Move metadata to start for streaming"
          checked={fastStart}
          onChange={setFastStart}
        />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="Video Compressor"
      toolIcon={<Video className="w-5 h-5 text-white" />}
      toolColor="from-purple-500 to-pink-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Compress Video',
        onClick: handleCompress,
        disabled: !file,
        loading: processing,
        loadingText: `Compressing... ${progress}%`,
        icon: <TrendingDown className="w-5 h-5" />,
      }}
    >
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* File Dropzone */}
          <FileDropzone
            files={file ? [file] : []}
            onFilesChange={handleFilesChange}
            accept="video/mp4,video/webm,video/avi,video/mov,video/mkv,.mp4,.webm,.avi,.mov,.mkv"
            multiple={false}
            maxSize={500}
            title="Drop video file here"
            description="or click to browse • MP4, WebM, AVI, MOV, MKV"
            icon={<Video className="w-8 h-8" />}
            accentColor="purple"
            disabled={processing}
          />

          {/* Video Preview */}
          {file && preview && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-white/80">Preview</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-white/40">
                  <div className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {formatSize(file.size)}
                  </div>
                </div>
              </div>
              
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <video 
                  ref={videoRef}
                  src={preview} 
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                />
              </div>
              
              {/* Estimated Compression */}
              <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-medium">Estimated reduction</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">~{getEstimatedReduction()}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          {processing && (
            <div className="space-y-3">
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-white/40">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Compressing video... This may take a while for large files.</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Success State */
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center py-8"
          >
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Video Compressed!</h2>
            <p className="text-slate-600 dark:text-white/60">Reduced by {compressionRatio}%</p>
          </motion.div>

          {/* Size Comparison */}
          <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-3 gap-6 text-center mb-6">
              <div>
                <HardDrive className="w-6 h-6 text-slate-400 dark:text-white/40 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-white/50 mb-1">Original</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSize(result.originalSize)}</p>
              </div>
              <div>
                <TrendingDown className="w-6 h-6 text-purple-500 dark:text-purple-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-white/50 mb-1">Compressed</p>
                <p className="text-lg font-bold text-purple-500 dark:text-purple-400">{formatSize(result.compressedSize)}</p>
              </div>
              <div>
                <Zap className="w-6 h-6 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-white/50 mb-1">Saved</p>
                <p className="text-lg font-bold text-amber-500 dark:text-amber-400">{compressionRatio}%</p>
              </div>
            </div>

            {/* Visual Comparison */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-white/50 w-20">Original</span>
                <div className="flex-1 h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 dark:bg-white/30 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-white/50 w-20">Compressed</span>
                <div className="flex-1 h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: `${100 - compressionRatio}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold 
                hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Video
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Compress Another
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
