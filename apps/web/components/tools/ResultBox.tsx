'use client';

import { Download, CheckCircle, FileText } from 'lucide-react';

interface ResultBoxProps {
  fileName?: string;
  fileSize?: number;
  downloadUrl?: string;
  onDownload: () => void;
  message?: string;
}

export default function ResultBox({
  fileName,
  fileSize,
  downloadUrl,
  onDownload,
  message = 'Processing complete!'
}: ResultBoxProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200 dark:border-green-500/20">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-green-100 dark:bg-green-500/20">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{message}</h3>

          {fileName && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 mb-4 shadow-sm">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{fileName}</p>
                {fileSize && <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(fileSize)}</p>}
              </div>
            </div>
          )}

          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-600/20"
          >
            <Download className="w-5 h-5" />
            Download Result
          </button>
        </div>
      </div>
    </div>
  );
}
