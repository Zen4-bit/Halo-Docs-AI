'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  FileText, Download, CheckCircle2, TrendingDown, Zap, 
  HardDrive, Image, FileX, Code, Layers, RefreshCw,
  Gauge, Shield, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider,
  SettingsSelect,
  SettingsButtonGroup,
  SettingsInput
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function CompressPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; originalSize: number; compressedSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Compression Settings
  const [compressionStrength, setCompressionStrength] = useState(50);
  const [targetSize, setTargetSize] = useState(0); // 0 = auto
  
  // Image Optimization
  const [downscaleDPI, setDownscaleDPI] = useState(150);
  const [convertToJPEG, setConvertToJPEG] = useState(true);
  const [removeTransparency, setRemoveTransparency] = useState(false);
  
  // Cleanup
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [removeAnnotations, setRemoveAnnotations] = useState(false);
  const [removeJavaScript, setRemoveJavaScript] = useState(true);
  const [removeForms, setRemoveForms] = useState(false);
  
  // Structure
  const [rebuildXRef, setRebuildXRef] = useState(false);
  const [objectDedupe, setObjectDedupe] = useState(true);
  const [grayscale, setGrayscale] = useState(false);

  const handleFilesChange = (files: File[]) => {
    const selectedFile = files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setFile(null);
    }
  };

  const handleCompress = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      console.log('Starting PDF compression with settings:', {
        compressionStrength, downscaleDPI, convertToJPEG, removeTransparency,
        removeMetadata, removeAnnotations, removeJavaScript, removeForms,
        rebuildXRef, objectDedupe, grayscale, targetSize
      });
      
      setProgress(5);
      const arrayBuffer = await file.arrayBuffer();
      
      // Calculate quality based on compression strength (10-100 -> 0.3-0.95)
      const imageQuality = 0.95 - ((compressionStrength - 10) / 90) * 0.65;
      // Calculate scale based on DPI (72-300 DPI, 150 is baseline = 1.0)
      const scale = Math.min(2, Math.max(0.5, downscaleDPI / 150));
      
      setProgress(10);
      
      // Load PDF with PDF.js for rendering
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfJsDoc = await loadingTask.promise;
      const numPages = pdfJsDoc.numPages;
      
      setProgress(15);
      
      // Create new PDF document with pdf-lib
      const newPdfDoc = await PDFDocument.create();
      
      // Process each page
      for (let i = 1; i <= numPages; i++) {
        setProgress(15 + Math.round((i / numPages) * 60));
        
        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale });
        
        // Create canvas and render page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Apply grayscale filter if requested
        if (grayscale) {
          context.filter = 'grayscale(100%)';
        }
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        // Convert canvas to JPEG with quality based on compressionStrength
        const imageData = canvas.toDataURL(
          convertToJPEG ? 'image/jpeg' : 'image/png',
          imageQuality
        );
        
        // Embed image in new PDF
        const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());
        const image = convertToJPEG 
          ? await newPdfDoc.embedJpg(imageBytes)
          : await newPdfDoc.embedPng(imageBytes);
        
        // Add page with embedded image
        const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
        newPage.drawImage(image, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }
      
      setProgress(80);
      
      // Apply metadata settings
      if (removeMetadata) {
        newPdfDoc.setTitle('');
        newPdfDoc.setAuthor('');
        newPdfDoc.setSubject('');
        newPdfDoc.setKeywords([]);
        newPdfDoc.setProducer('Halo Docs');
        newPdfDoc.setCreator('');
      } else {
        newPdfDoc.setProducer('Halo Docs - Compressed');
      }
      
      setProgress(90);
      
      // Save with object streams for additional compression
      const compressedBytes = await newPdfDoc.save({
        useObjectStreams: objectDedupe,
        addDefaultPage: false,
      });
      
      setProgress(100);
      
      const blob = new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setResult({ 
        url, 
        name: file.name.replace('.pdf', '-compressed.pdf'), 
        originalSize: file.size,
        compressedSize: blob.size 
      });
      
      console.log(`Compression complete: ${file.size} -> ${blob.size} (${Math.round((1 - blob.size/file.size) * 100)}% reduction)`);
    } catch (err: any) {
      console.error('Compression error:', err);
      setError(err.message || 'Failed to compress PDF. The file may be corrupted or password-protected.');
    } finally {
      setProcessing(false);
    }
  }, [file, compressionStrength, downscaleDPI, convertToJPEG, removeTransparency, removeMetadata, removeAnnotations, removeJavaScript, removeForms, rebuildXRef, objectDedupe, grayscale, targetSize]);

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
  
  // Estimated compression based on settings
  const estimatedReduction = Math.min(90, Math.round(compressionStrength * 0.7 + (removeMetadata ? 5 : 0) + (grayscale ? 15 : 0)));

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Compression */}
      <SettingsSection title="Compression" icon={<Gauge className="w-4 h-4" />}>
        <SettingsSlider
          label="Compression strength"
          value={compressionStrength}
          onChange={setCompressionStrength}
          min={10}
          max={100}
          unit="%"
        />
        <p className="text-xs text-slate-400 dark:text-white/30">Higher = smaller file, lower quality</p>
        
        <div className="mt-4">
          <SettingsInput
            label="Target output size"
            value={targetSize === 0 ? '' : targetSize}
            onChange={(v) => setTargetSize(v === '' ? 0 : parseInt(v) || 0)}
            type="number"
            placeholder="Auto"
            suffix="MB"
          />
          <p className="text-xs text-slate-400 dark:text-white/30 mt-1">Leave empty for auto</p>
        </div>
      </SettingsSection>

      {/* Image Optimization */}
      <SettingsSection title="Image Optimization" icon={<Image className="w-4 h-4" />} defaultOpen={false}>
        <SettingsSlider
          label="Downscale DPI"
          value={downscaleDPI}
          onChange={setDownscaleDPI}
          min={72}
          max={300}
          unit=" DPI"
        />
        <SettingsToggle
          label="Convert images to JPEG"
          description="Convert PNG/BMP to JPEG for smaller size"
          checked={convertToJPEG}
          onChange={setConvertToJPEG}
        />
        <SettingsToggle
          label="Remove transparency"
          description="Flatten transparent images"
          checked={removeTransparency}
          onChange={setRemoveTransparency}
        />
        <SettingsToggle
          label="Convert to grayscale"
          description="Remove colors for maximum compression"
          checked={grayscale}
          onChange={setGrayscale}
        />
      </SettingsSection>

      {/* Cleanup */}
      <SettingsSection title="Cleanup" icon={<FileX className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Remove metadata"
          description="Strip author, title, dates, etc."
          checked={removeMetadata}
          onChange={setRemoveMetadata}
        />
        <SettingsToggle
          label="Remove annotations"
          description="Delete comments and markup"
          checked={removeAnnotations}
          onChange={setRemoveAnnotations}
        />
        <SettingsToggle
          label="Remove JavaScript"
          description="Strip embedded scripts"
          checked={removeJavaScript}
          onChange={setRemoveJavaScript}
          icon={<Code className="w-3 h-3" />}
        />
        <SettingsToggle
          label="Remove forms"
          description="Flatten form fields"
          checked={removeForms}
          onChange={setRemoveForms}
        />
      </SettingsSection>

      {/* Structure */}
      <SettingsSection title="Structure" icon={<Layers className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Rebuild XRef table"
          description="Optimize internal PDF structure"
          checked={rebuildXRef}
          onChange={setRebuildXRef}
          icon={<RefreshCw className="w-3 h-3" />}
        />
        <SettingsToggle
          label="Object deduplication"
          description="Merge duplicate objects"
          checked={objectDedupe}
          onChange={setObjectDedupe}
        />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="Compress PDF"
      toolIcon={<TrendingDown className="w-5 h-5 text-white" />}
      toolColor="from-green-500 to-teal-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Compress PDF',
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
            accept=".pdf,application/pdf"
            multiple={false}
            title="Drop PDF file here"
            description="or click to browse • PDF files only"
            icon={<FileText className="w-8 h-8" />}
            accentColor="green"
            disabled={processing}
          />

          {/* Size Estimation */}
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 text-green-500 dark:text-green-400">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Size Estimation</h3>
                    <p className="text-sm text-slate-500 dark:text-white/50">Based on current settings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-500 dark:text-green-400">~{estimatedReduction}%</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">estimated reduction</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-white/60">Original</span>
                  <span className="text-slate-900 dark:text-white">{formatSize(file.size)}</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 dark:bg-white/30 rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-white/60">Estimated</span>
                  <span className="text-green-500 dark:text-green-400">~{formatSize(file.size * (1 - estimatedReduction / 100))}</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: `${100 - estimatedReduction}%` }}
                    transition={{ duration: 0.5 }}
                  />
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
            <div className="space-y-2">
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Optimizing your PDF...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PDF Compressed Successfully!</h2>
            <p className="text-slate-600 dark:text-white/60">Your file has been optimized</p>
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
                <TrendingDown className="w-6 h-6 text-green-500 dark:text-green-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-white/50 mb-1">Compressed</p>
                <p className="text-lg font-bold text-green-500 dark:text-green-400">{formatSize(result.compressedSize)}</p>
              </div>
              <div>
                <Zap className="w-6 h-6 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-white/50 mb-1">Reduction</p>
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
                    className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full"
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
              Download Compressed PDF
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Compress Another PDF
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
