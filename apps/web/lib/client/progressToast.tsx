import { toast } from 'sonner';
import React from 'react';

export const showProgressToast = (message: string, progress: number) => {
    const id = 'progress-toast';

    toast.custom((t) => (
        <div className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-lg flex items-center gap-4">
            <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">{message}</p>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
        </div>
    ), { id, duration: Infinity });

    if (progress >= 100) {
        setTimeout(() => toast.dismiss(id), 1000);
    }
};

export const dismissProgressToast = () => {
    toast.dismiss('progress-toast');
};
