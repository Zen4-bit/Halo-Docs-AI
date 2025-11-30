'use client';

import { Settings } from 'lucide-react';
import { useState } from 'react';

interface OptionConfig {
  type: 'slider' | 'select' | 'boolean' | 'number' | 'text';
  label: string;
  default: any;
  min?: number;
  max?: number;
  options?: string[];
}

interface AdvancedOptionsProps {
  options: Record<string, OptionConfig>;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export default function AdvancedOptions({ options, values, onChange }: AdvancedOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!options || Object.keys(options).length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
      >
        <Settings className="w-5 h-5" />
        <span className="font-medium">Advanced Options</span>
        <span className="text-xs text-slate-500 dark:text-slate-500">
          ({isExpanded ? 'Hide' : 'Show'})
        </span>
      </button>

      {isExpanded && (
        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 space-y-4">
          {Object.entries(options).map(([key, config]) => (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {config.label}
              </label>

              {config.type === 'slider' && (
                <div className="space-y-2">
                  <input
                    type="range"
                    min={config.min || 0}
                    max={config.max || 100}
                    value={values[key] ?? config.default}
                    onChange={(e) => onChange(key, parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{config.min || 0}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{values[key] ?? config.default}</span>
                    <span>{config.max || 100}</span>
                  </div>
                </div>
              )}

              {config.type === 'select' && (
                <select
                  value={values[key] ?? config.default}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {config.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {config.type === 'boolean' && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={values[key] ?? config.default}
                      onChange={(e) => onChange(key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {values[key] ?? config.default ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              )}

              {config.type === 'number' && (
                <input
                  type="number"
                  min={config.min}
                  max={config.max}
                  value={values[key] ?? config.default}
                  onChange={(e) => onChange(key, parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              )}

              {config.type === 'text' && (
                <input
                  type="text"
                  value={values[key] ?? config.default}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={config.label}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
