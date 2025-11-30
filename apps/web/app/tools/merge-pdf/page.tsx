'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Upload, X, GripVertical, Download, Loader2, 
  Plus, Trash2, ChevronUp, ChevronDown, CheckCircle2, AlertCircle,
  Layers, Settings2, Bookmark, FileX
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pages?: number;
}

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
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
        isDragging 
          ? 'bg-amber-500/20 border-amber-500/50 shadow-xl shadow-amber-500/20 scale-[1.02]' 
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 rounded-lg hover:bg-zinc-700/50 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-amber-400 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      
      <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
        <FileText className="w-6 h-6" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{pdf.name}</p>
        <p className="text-sm text-zinc-500">{formatSize(pdf.size)}</p>
      </div>
      
      <button
        onClick={() => onRemove(pdf.id)}
        className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function MergePDFPage() {
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Options
  const [removeMetadata, setRemoveMetadata] = useState(false);
  const [addBookmarks, setAddBookmarks] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    addFiles(files);
  }, []);

  const addFiles = (files: File[]) => {
    const newPdfs: PDFFile[] = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
    }));
    setPdfs(prev => [...prev, ...newPdfs]);
    setError(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      addFiles(files);
    }
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

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < pdfs.length) {
      setPdfs(prev => arrayMove(prev, index, newIndex));
    }
  };

  const handleMerge = async () => {
    if (pdfs.length < 2) {
      setError('Please add at least 2 PDF files to merge');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      pdfs.forEach(pdf => formData.append('files', pdf.file));
      formData.append('removeMetadata', String(removeMetadata));
      formData.append('addBookmarks', String(addBookmarks));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const response = await fetch('/api/tools/merge-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Failed to merge PDFs');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: 'merged.pdf', size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to merge PDFs');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/25">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              PDF TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Merge PDF Files</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Combine multiple PDF documents into a single file. Drag to reorder, then merge with one click.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!result ? (
          <div className="space-y-8">
            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative border-2 border-dashed border-zinc-700 hover:border-red-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-red-500/5 group"
            >
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-red-500/20 transition-colors mb-4">
                  <Upload className="w-10 h-10 text-zinc-400 group-hover:text-red-400 transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Drop PDF files here</h3>
                <p className="text-zinc-500 mb-4">or click to browse • PDF files only</p>
                <button className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add PDF Files
                </button>
              </div>
            </div>

            {/* File List with Drag & Drop */}
            {pdfs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-400" />
                    {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''} selected
                  </h3>
                  <button
                    onClick={() => setPdfs([])}
                    className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pdfs.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {pdfs.map((pdf, index) => (
                        <SortableItem key={pdf.id} pdf={pdf} onRemove={removeFile} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <p className="text-sm text-zinc-500 text-center">
                  Drag files to reorder • First file will be first in merged PDF
                </p>
              </div>
            )}

            {/* Options */}
            {pdfs.length > 0 && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-amber-400" />
                  Merge Options
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 cursor-pointer hover:border-zinc-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={addBookmarks}
                      onChange={(e) => setAddBookmarks(e.target.checked)}
                      className="w-5 h-5 rounded border-zinc-600 text-amber-500 focus:ring-amber-500/20"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Bookmark className="w-4 h-4 text-amber-400" />
                        Add Bookmarks
                      </div>
                      <p className="text-sm text-zinc-500">Create bookmarks for each file</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 cursor-pointer hover:border-zinc-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={removeMetadata}
                      onChange={(e) => setRemoveMetadata(e.target.checked)}
                      className="w-5 h-5 rounded border-zinc-600 text-amber-500 focus:ring-amber-500/20"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-white font-medium">
                        <FileX className="w-4 h-4 text-amber-400" />
                        Remove Metadata
                      </div>
                      <p className="text-sm text-zinc-500">Strip document metadata</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Merge Button */}
            <button
              onClick={handleMerge}
              disabled={pdfs.length < 2 || processing}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                pdfs.length < 2 || processing
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Merging... {progress}%
                </>
              ) : (
                <>
                  <Layers className="w-6 h-6" />
                  Merge {pdfs.length} PDF Files
                </>
              )}
            </button>

            {/* Progress */}
            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="text-center py-12 space-y-6">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">PDFs Merged Successfully!</h2>
            <p className="text-zinc-400">
              {pdfs.length} files combined • {formatSize(result.size)}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={handleDownload}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Merged PDF
              </button>
              <button
                onClick={reset}
                className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
              >
                Merge More PDFs
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
