'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

interface ProgressBarProps {
    progress: number;
    status?: string;
    isComplete?: boolean;
    showPercentage?: boolean;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress = 0,
    status = 'Processing...',
    isComplete = false,
    showPercentage = true,
    className = '',
}) => {
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Status and Percentage */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isComplete ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                        </div>
                    ) : (
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    )}
                    <span className="text-sm font-medium text-white">{status}</span>
                </div>
                {showPercentage && (
                    <span className="text-sm font-semibold text-white/80">
                        {clampedProgress.toFixed(0)}%
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 rounded-full bg-white/10 overflow-hidden backdrop-blur-sm">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedProgress}%` }}
                    transition={{
                        duration: 0.5,
                        ease: 'easeOut',
                    }}
                    className={`absolute inset-y-0 left-0 rounded-full ${isComplete
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-gradient'
                        }`}
                />

                {/* Shimmer Effect */}
                {!isComplete && clampedProgress < 100 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
            </div>

            {/* Optional Sub-status */}
            {!isComplete && (
                <p className="text-xs text-white/50">
                    Please wait while we process your file...
                </p>
            )}
        </div>
    );
};

// Add to globals.css or tailwind config:
// @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
// @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
// .animate-gradient { animation: gradient 3s ease infinite; }
// .animate-shimmer { animation: shimmer 2s infinite; }
