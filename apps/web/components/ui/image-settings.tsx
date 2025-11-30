'use client';

import React from 'react';
import { Settings } from 'lucide-react';

interface ImageSettingsProps {
  settings: {
    quality?: number;
    format?: string;
    progressive?: boolean;
    effort?: number;
    compressionLevel?: number;
    mozjpeg?: boolean;
  };
  onSettingsChange: (settings: any) => void;
  formatOptions?: string[];
  showFormat?: boolean;
  showQuality?: boolean;
  showProgressive?: boolean;
  showEffort?: boolean;
  showCompressionLevel?: boolean;
  showMozjpeg?: boolean;
}

export function ImageSettings({
  settings,
  onSettingsChange,
  formatOptions = ['original', 'jpeg', 'png', 'webp'],
  showFormat = true,
  showQuality = true,
  showProgressive = false,
  showEffort = false,
  showCompressionLevel = false,
  showMozjpeg = false,
}: ImageSettingsProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Image Settings
      </h2>
      <div className="space-y-4">
        {showFormat && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Output Format
            </label>
            <select
              value={settings.format || 'original'}
              onChange={(e) => onSettingsChange({ ...settings, format: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {formatOptions.map((format) => (
                <option key={format} value={format}>
                  {format.charAt(0).toUpperCase() + format.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {showQuality && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quality: {settings.quality || 80}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.quality || 80}
              onChange={(e) => onSettingsChange({ ...settings, quality: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Lower size</span>
              <span>Higher quality</span>
            </div>
          </div>
        )}

        {showCompressionLevel && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Compression Level: {settings.compressionLevel || 6}
            </label>
            <input
              type="range"
              min="0"
              max="9"
              value={settings.compressionLevel || 6}
              onChange={(e) => onSettingsChange({ ...settings, compressionLevel: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast</span>
              <span>Best compression</span>
            </div>
          </div>
        )}

        {showEffort && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Encoding Effort: {settings.effort || 4}
            </label>
            <input
              type="range"
              min="0"
              max="6"
              value={settings.effort || 4}
              onChange={(e) => onSettingsChange({ ...settings, effort: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast</span>
              <span>Best quality</span>
            </div>
          </div>
        )}

        {showProgressive && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="progressive"
              checked={settings.progressive !== false}
              onChange={(e) => onSettingsChange({ ...settings, progressive: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="progressive" className="ml-2 text-sm text-gray-300">
              Progressive loading
            </label>
          </div>
        )}

        {showMozjpeg && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="mozjpeg"
              checked={settings.mozjpeg !== false}
              onChange={(e) => onSettingsChange({ ...settings, mozjpeg: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="mozjpeg" className="ml-2 text-sm text-gray-300">
              Use MozJPEG encoder
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
