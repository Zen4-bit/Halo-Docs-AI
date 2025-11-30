'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface ProcessButtonProps {
  onClick: () => void;
  disabled?: boolean;
  processing?: boolean;
  text: string;
  processingText?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ProcessButton({
  onClick,
  disabled = false,
  processing = false,
  text,
  processingText = 'Processing...',
  icon,
  className = '',
}: ProcessButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || processing}
      className={`w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center ${className}`}
    >
      {processing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {processingText}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {text}
        </>
      )}
    </button>
  );
}

interface DownloadButtonProps {
  onClick: () => void;
  disabled?: boolean;
  text: string;
  className?: string;
}

export function DownloadButton({
  onClick,
  disabled = false,
  text = 'Download',
  className = '',
}: DownloadButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center ${className}`}
    >
      <Download className="h-4 w-4 mr-2" />
      {text}
    </button>
  );
}
