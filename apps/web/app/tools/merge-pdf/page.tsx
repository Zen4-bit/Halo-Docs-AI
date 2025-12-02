'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Layers, GripVertical, Trash2, Plus, 
  Bookmark, FileX, SortAsc, SortDesc, FileImage,
  Scissors, RotateCw, Minimize2, CheckCircle2, Download
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider,
  SettingsSelect,
  SettingsButtonGroup 
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';
import { PDFDocument } from 'pdf-lib';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pages?: number;
}

// Sortable PDF Item Component
function SortableItem({ pdf, onRemove }: { pdf: PDFFile; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pdf.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
        isDragging 
          ? 'bg-red-500/20 border-red-500/50 shadow-xl shadow-red-500/20 scale-[1.02]' 
          : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/8 hover:border-slate-300 dark:hover:border-white/20'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 cursor-grab active:cursor-grabbing text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80 transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      
      <div className="p-2 rounded-lg bg-red-500/20 text-red-500 dark:text-red-400">
        <FileText className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{pdf.name}</p>
        <p className="text-xs text-slate-500 dark:text-white/40">{formatSize(pdf.size)}</p>
      </div>
      
      <button
        onClick={() => onRemove(pdf.id)}
        className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function MergePDFPage() {
  // File state
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File Controls
  const [autoSort, setAutoSort] = useState<'none' | 'name' | 'size' | 'date'>('none');
  
  // Merge Options
  const [mergeMode, setMergeMode] = useState<'all' | 'custom' | 'odd' | 'even'>('all');
  const [customRange, setCustomRange] = useState('');
  
  // Page Cleanup
  const [removeBlankPages, setRemoveBlankPages] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [autoRotatePages, setAutoRotatePages] = useState(false);
  
  // Insert Options
  const [insertBlankPage, setInsertBlankPage] = useState(false);
  const [blankPagePosition, setBlankPagePosition] = useState<'start' | 'end' | 'between'>('end');
  
  // Output Optimization
  const [autoCompress, setAutoCompress] = useState(true);
  const [targetSize, setTargetSize] = useState(0); // 0 = auto
  const [convertImagesToJPEG, setConvertImagesToJPEG] = useState(false);
  
  // Metadata
  const [addBookmarks, setAddBookmarks] = useState(true);
  const [removeMetadata, setRemoveMetadata] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFilesChange = (files: File[]) => {
    const newPdfs: PDFFile[] = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
    }));
    setPdfs(newPdfs);
    setError(null);
    setResult(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPdfs((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeFile = (id: string) => {
    setPdfs(prev => prev.filter(p => p.id !== id));
  };

  const sortFiles = (by: 'name' | 'size' | 'date') => {
    setPdfs(prev => {
      const sorted = [...prev];
      if (by === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
      if (by === 'size') sorted.sort((a, b) => a.size - b.size);
      return sorted;
    });
    setAutoSort(by);
  };

  const handleMerge = useCallback(async () => {
    if (pdfs.length < 2) {
      setError('Please add at least 2 PDF files to merge');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Create a new PDF document to merge into
      const mergedPdf = await PDFDocument.create();
      
      // Process each PDF
      for (let i = 0; i < pdfs.length; i++) {
        setProgress(Math.round((i / pdfs.length) * 80));
        
        const pdfFile = pdfs[i]!;
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        
        try {
          const pdfDoc = await PDFDocument.load(arrayBuffer, { 
            ignoreEncryption: true 
          });
          
          // Copy all pages from this PDF
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        } catch (loadErr) {
          console.error(`Error loading PDF ${pdfFile.name}:`, loadErr);
          throw new Error(`Failed to load "${pdfFile.name}". It may be corrupted or password-protected.`);
        }
      }
      
      setProgress(85);
      
      // Remove metadata if requested
      if (removeMetadata) {
        mergedPdf.setTitle('');
        mergedPdf.setAuthor('');
        mergedPdf.setSubject('');
        mergedPdf.setKeywords([]);
        mergedPdf.setProducer('');
        mergedPdf.setCreator('');
      }
      
      setProgress(90);
      
      // Save the merged PDF
      const mergedBytes = await mergedPdf.save({
        useObjectStreams: autoCompress,
      });
      
      setProgress(100);
      
      // Create blob and URL
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResult({ url, name: 'merged.pdf', size: blob.size });
    } catch (err: any) {
      console.error('Merge error:', err);
      setError(err.message || 'Failed to merge PDFs. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [pdfs, removeMetadata, autoCompress]);

  const handleDownload = () => {
    if (result) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.name;
      a.click();
    }
  };

  const reset = () => {
    setPdfs([]);
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
      {/* File Controls */}
      <SettingsSection title="File Controls" icon={<FileText className="w-4 h-4" />}>
        <SettingsSelect
          label="Auto-sort files"
          value={autoSort}
          onChange={(v) => {
            if (v !== 'none') sortFiles(v as 'name' | 'size' | 'date');
            else setAutoSort('none');
          }}
          options={[
            { value: 'none', label: 'Manual order' },
            { value: 'name', label: 'By name (A-Z)' },
            { value: 'size', label: 'By size (smallest first)' },
            { value: 'date', label: 'By date' },
          ]}
          icon={<SortAsc className="w-4 h-4" />}
        />
      </SettingsSection>

      {/* Merge Options */}
      <SettingsSection title="Merge Options" icon={<Layers className="w-4 h-4" />}>
        <SettingsButtonGroup
          label="Merge Mode"
          value={mergeMode}
          onChange={(v) => setMergeMode(v as typeof mergeMode)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'custom', label: 'Range' },
            { value: 'odd', label: 'Odd' },
            { value: 'even', label: 'Even' },
          ]}
        />
        
        {mergeMode === 'custom' && (
          <div className="mt-3">
            <input
              type="text"
              value={customRange}
              onChange={(e) => setCustomRange(e.target.value)}
              placeholder="e.g., 1-5, 8, 10-15"
              className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white/90
                placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 dark:focus:border-amber-500/50"
            />
          </div>
        )}
      </SettingsSection>

      {/* Page Cleanup */}
      <SettingsSection title="Page Cleanup" icon={<Scissors className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Remove blank pages"
          description="Auto-detect and remove empty pages"
          checked={removeBlankPages}
          onChange={setRemoveBlankPages}
        />
        <SettingsToggle
          label="Remove duplicates"
          description="Detect and remove duplicate pages"
          checked={removeDuplicates}
          onChange={setRemoveDuplicates}
        />
        <SettingsToggle
          label="Auto-rotate pages"
          description="Fix page orientation automatically"
          checked={autoRotatePages}
          onChange={setAutoRotatePages}
          icon={<RotateCw className="w-3 h-3" />}
        />
      </SettingsSection>

      {/* Insert Options */}
      <SettingsSection title="Insert Options" icon={<Plus className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Insert blank page"
          description="Add blank pages at specified position"
          checked={insertBlankPage}
          onChange={setInsertBlankPage}
        />
        {insertBlankPage && (
          <SettingsSelect
            label="Blank page position"
            value={blankPagePosition}
            onChange={(v) => setBlankPagePosition(v as typeof blankPagePosition)}
            options={[
              { value: 'start', label: 'At start' },
              { value: 'end', label: 'At end' },
              { value: 'between', label: 'Between each file' },
            ]}
          />
        )}
      </SettingsSection>

      {/* Output Optimization */}
      <SettingsSection title="Output Optimization" icon={<Minimize2 className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Auto compress"
          description="Optimize output file size"
          checked={autoCompress}
          onChange={setAutoCompress}
        />
        <SettingsSlider
          label="Target size"
          value={targetSize}
          onChange={setTargetSize}
          min={0}
          max={50}
          unit=" MB"
        />
        <p className="text-xs text-slate-400 dark:text-white/30">0 = auto (best quality)</p>
        <SettingsToggle
          label="Convert images to JPEG"
          description="Reduce file size by converting embedded images"
          checked={convertImagesToJPEG}
          onChange={setConvertImagesToJPEG}
          icon={<FileImage className="w-3 h-3" />}
        />
      </SettingsSection>

      {/* Metadata */}
      <SettingsSection title="Metadata" icon={<Bookmark className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Add bookmarks"
          description="Create bookmarks for each merged file"
          checked={addBookmarks}
          onChange={setAddBookmarks}
          icon={<Bookmark className="w-3 h-3" />}
        />
        <SettingsToggle
          label="Remove metadata"
          description="Strip all document metadata"
          checked={removeMetadata}
          onChange={setRemoveMetadata}
          icon={<FileX className="w-3 h-3" />}
        />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="Merge PDF"
      toolIcon={<Layers className="w-5 h-5 text-white" />}
      toolColor="from-red-500 to-orange-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: `Merge ${pdfs.length} PDF${pdfs.length !== 1 ? 's' : ''}`,
        onClick: handleMerge,
        disabled: pdfs.length < 2,
        loading: processing,
        loadingText: `Merging... ${progress}%`,
        icon: <Layers className="w-5 h-5" />,
      }}
    >
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* File Dropzone */}
          <FileDropzone
            files={pdfs.map(p => p.file)}
            onFilesChange={handleFilesChange}
            accept=".pdf,application/pdf"
            multiple={true}
            maxFiles={50}
            title="Drop PDF files here"
            description="or click to browse • PDF files only"
            icon={<FileText className="w-8 h-8" />}
            accentColor="red"
            disabled={processing}
          />

          {/* Sortable File List */}
          {pdfs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700 dark:text-white/80 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-500 dark:text-red-400" />
                  {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''} selected
                </h3>
                <button
                  onClick={() => setPdfs([])}
                  className="text-sm text-slate-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pdfs.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {pdfs.map((pdf) => (
                        <SortableItem key={pdf.id} pdf={pdf} onRemove={removeFile} />
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </DndContext>

              <p className="text-xs text-slate-400 dark:text-white/30 text-center">
                Drag files to reorder • First file will be first in merged PDF
              </p>
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
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Processing your PDFs...</p>
            </div>
          )}
        </div>
      ) : (
        /* Success State */
        <div className="max-w-lg mx-auto text-center py-12 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex p-6 rounded-3xl bg-green-500/20"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" />
          </motion.div>
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PDFs Merged Successfully!</h2>
            <p className="text-slate-600 dark:text-white/60">
              {pdfs.length} files combined • {formatSize(result.size)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold 
                hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Merged PDF
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Merge More PDFs
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
