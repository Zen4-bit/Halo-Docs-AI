'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, CheckCircle2, Crop, Ratio, Image, 
  Square, RectangleHorizontal, Move, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsSlider,
  SettingsButtonGroup,
  SettingsInput
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

// Client-side crop function using Canvas
async function cropImageClientSide(
  file: File,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  originalWidth: number,
  originalHeight: number,
  outputQuality: number,
  outputFormat: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      // Calculate scale factor between display and actual image
      const scaleX = img.naturalWidth / originalWidth;
      const scaleY = img.naturalHeight / originalHeight;
      
      // Scale crop coordinates to actual image dimensions
      const actualX = Math.round(cropX * scaleX);
      const actualY = Math.round(cropY * scaleY);
      const actualWidth = Math.round(cropWidth * scaleX);
      const actualHeight = Math.round(cropHeight * scaleY);
      
      const canvas = document.createElement('canvas');
      canvas.width = actualWidth;
      canvas.height = actualHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw the cropped portion
      ctx.drawImage(img, actualX, actualY, actualWidth, actualHeight, 0, 0, actualWidth, actualHeight);
      
      // Convert to blob
      const mimeType = outputFormat === 'png' ? 'image/png' : 
                       outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        mimeType,
        outputQuality / 100
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const ASPECT_RATIOS = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
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
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Output settings
  const [outputQuality, setOutputQuality] = useState(90);
  const [outputFormat, setOutputFormat] = useState<'original' | 'jpg' | 'png' | 'webp'>('original');

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

  useEffect(() => {
    if (preview && imageRef.current) {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        const containerWidth = containerRef.current?.clientWidth || 400;
        const initialSize = Math.min(containerWidth * 0.5, 200);
        setCropArea({ x: 50, y: 50, width: initialSize, height: initialSize });
      };
      img.src = preview;
    }
  }, [preview]);

  const handleAspectRatioChange = (ratioId: string) => {
    setAspectRatio(ratioId);
    const ratio = ASPECT_RATIOS.find(r => r.id === ratioId);
    if (ratio?.ratio) {
      const newHeight = cropArea.width / ratio.ratio;
      setCropArea(prev => ({ ...prev, height: newHeight }));
    }
  };

  const handleCrop = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Log all settings being applied
      console.log('Crop Image Settings:', {
        aspectRatio,
        cropArea,
        imageDimensions,
        outputQuality,
        outputFormat
      });
      
      setProgress(20);
      
      // Determine output format
      const format = outputFormat === 'original' 
        ? (file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg')
        : outputFormat;
      
      setProgress(40);
      
      // Crop the image client-side
      const croppedBlob = await cropImageClientSide(
        file,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        imageDimensions.width,
        imageDimensions.height,
        outputQuality,
        format
      );
      
      setProgress(80);
      
      // Create URL for the cropped image
      const url = URL.createObjectURL(croppedBlob);
      const ext = format === 'png' ? '.png' : format === 'webp' ? '.webp' : '.jpg';
      
      setProgress(100);
      
      setResult({ 
        url, 
        name: file.name.replace(/\.[^.]+$/, `-cropped${ext}`), 
        size: croppedBlob.size 
      });
    } catch (err: any) {
      console.error('Crop error:', err);
      setError(err.message || 'Failed to crop image. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [file, aspectRatio, cropArea, imageDimensions, outputQuality, outputFormat]);

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

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Aspect Ratio */}
      <SettingsSection title="Aspect Ratio" icon={<Ratio className="w-4 h-4" />}>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map(ratio => (
            <button
              key={ratio.id}
              onClick={() => handleAspectRatioChange(ratio.id)}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                aspectRatio === ratio.id 
                  ? 'bg-teal-500/30 text-slate-900 dark:text-white' 
                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Crop Area */}
      <SettingsSection title="Crop Size" icon={<Square className="w-4 h-4" />} defaultOpen={false}>
        <div className="space-y-3">
          <SettingsInput
            label="Width (px)"
            type="number"
            value={String(Math.round(cropArea.width))}
            onChange={(v) => setCropArea(prev => ({ ...prev, width: parseInt(v) || 0 }))}
            placeholder="Width"
          />
          <SettingsInput
            label="Height (px)"
            type="number"
            value={String(Math.round(cropArea.height))}
            onChange={(v) => setCropArea(prev => ({ ...prev, height: parseInt(v) || 0 }))}
            placeholder="Height"
          />
        </div>
      </SettingsSection>

      {/* Output */}
      <SettingsSection title="Output" icon={<Image className="w-4 h-4" />} defaultOpen={false}>
        <SettingsSlider
          label="Quality"
          value={outputQuality}
          onChange={setOutputQuality}
          min={10}
          max={100}
          unit="%"
        />
        <div className="mt-3">
          <SettingsButtonGroup
            label="Format"
            value={outputFormat}
            onChange={(v) => setOutputFormat(v as typeof outputFormat)}
            options={[
              { value: 'original', label: 'Same' },
              { value: 'jpg', label: 'JPG' },
              { value: 'png', label: 'PNG' },
              { value: 'webp', label: 'WebP' },
            ]}
          />
        </div>
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="Crop Image"
      toolIcon={<Crop className="w-5 h-5 text-white" />}
      toolColor="from-teal-500 to-cyan-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Crop Image',
        onClick: handleCrop,
        disabled: !file,
        loading: processing,
        loadingText: `Cropping... ${progress}%`,
        icon: <Crop className="w-5 h-5" />,
      }}
    >
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* File Dropzone */}
          <FileDropzone
            files={file ? [file] : []}
            onFilesChange={handleFilesChange}
            accept="image/*"
            multiple={false}
            title="Drop image here"
            description="or click to browse • PNG, JPG, WebP, GIF"
            icon={<Image className="w-8 h-8" />}
            accentColor="blue"
            disabled={processing}
          />

          {/* Crop Canvas */}
          {file && preview && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/60">
                  <Move className="w-4 h-4" />
                  Drag to reposition
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/40">
                  <HardDrive className="w-3 h-3" />
                  {formatSize(file.size)}
                </div>
              </div>
              
              <div 
                ref={containerRef}
                className="relative aspect-video rounded-xl overflow-hidden bg-black/20 flex items-center justify-center"
              >
                <img 
                  ref={imageRef}
                  src={preview} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain"
                />
                
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
                    <div className="absolute inset-0 bg-white/10" />
                    
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
                        className={`absolute w-3 h-3 bg-teal-400 border-2 border-white rounded-sm
                          ${corner.includes('top') ? '-top-1.5' : '-bottom-1.5'}
                          ${corner.includes('left') ? '-left-1.5' : '-right-1.5'}
                        `}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-center">
                <span className="text-sm text-teal-400">
                  Selection: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px
                </span>
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
            <div className="space-y-2">
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Cropping your image...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Image Cropped!</h2>
            <p className="text-slate-600 dark:text-white/60">{result.name} • {formatSize(result.size)}</p>
          </motion.div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <img src={result.url} alt="Cropped" className="max-w-full mx-auto rounded-lg" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold 
                hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Image
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Crop Another
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
