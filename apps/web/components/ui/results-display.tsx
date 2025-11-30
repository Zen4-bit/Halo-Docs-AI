'use client';

import React from 'react';
import { Download, BarChart3 } from 'lucide-react';

interface ProcessingResult {
  originalSize: number;
  compressedSize?: number;
  outputSize?: number;
  dimensions?: { width: number; height: number };
  format?: string;
  compressionRatio?: number;
  filename?: string;
}

interface ResultsDisplayProps {
  result: ProcessingResult;
  onDownload: () => void;
  title?: string;
  showComparison?: boolean;
}

export function ResultsDisplay({
  result,
  onDownload,
  title = 'Processing Results',
  showComparison = true,
}: ResultsDisplayProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateCompressionRatio = (): string => {
    if (!showComparison || !result.compressedSize) return '';
    const ratio = ((result.originalSize - result.compressedSize) / result.originalSize * 100);
    return ratio.toFixed(1);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2" />
        {title}
      </h3>
      <div className="space-y-3">
        {showComparison && result.compressedSize && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Original Size:</span>
              <span className="text-white">
                {formatFileSize(result.originalSize)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Compressed Size:</span>
              <span className="text-white">
                {formatFileSize(result.compressedSize)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Space Saved:</span>
              <span className="text-green-400 font-medium">
                {calculateCompressionRatio()}%
              </span>
            </div>
          </>
        )}
        
        {result.outputSize && !showComparison && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Output Size:</span>
            <span className="text-white">
              {formatFileSize(result.outputSize)}
            </span>
          </div>
        )}

        {result.dimensions && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Dimensions:</span>
            <span className="text-white">
              {result.dimensions.width} × {result.dimensions.height}
            </span>
          </div>
        )}

        {result.format && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Format:</span>
            <span className="text-white uppercase">
              {result.format}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={onDownload}
        className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
      >
        <Download className="h-4 w-4 mr-2" />
        Download {result.filename || 'Processed Image'}
      </button>
    </div>
  );
}
