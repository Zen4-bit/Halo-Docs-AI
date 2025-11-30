'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FilePreview } from './FilePreview';
import { UniversalUpload } from './UniversalUpload';
import { useActiveFile } from '@/context/ActiveFileContext';

interface WorkspaceLayoutProps {
    title: string;
    description: string;
    icon?: string;
    toolsSidebar: ReactNode;
    controlsPanel: ReactNode;
    outputPanel: ReactNode;
    acceptedFileTypes?: string;
    supportedFormats?: string;
}

export function WorkspaceLayout({
    title,
    description,
    icon,
    toolsSidebar,
    controlsPanel,
    outputPanel,
    acceptedFileTypes,
    supportedFormats,
}: WorkspaceLayoutProps) {
    const { file } = useActiveFile();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 selection:bg-brand-500/30">
            {/* Top Header */}
            <div className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/tools"
                                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-400" />
                            </Link>
                            {icon && <span className="text-2xl">{icon}</span>}
                            <div>
                                <h1 className="text-xl font-bold text-white">{title}</h1>
                                <p className="text-sm text-slate-400">{description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                <span className="text-xs font-semibold text-green-400">
                                    🔒 CLIENT-SIDE
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex h-[calc(100vh-73px)]">
                {/* Left Sidebar - Tools Menu */}
                <div className="w-80 flex-shrink-0 border-r border-white/5 bg-slate-900/30 overflow-y-auto">
                    {toolsSidebar}
                </div>

                {/* Center - 3 Panels Layout */}
                <div className="flex-1 flex flex-col">
                    {/* Top Row - Upload & Preview */}
                    <div className="flex-1 grid grid-cols-2 gap-px bg-slate-800/20">
                        {/* Upload Panel */}
                        <div className="bg-slate-900/50 p-6 overflow-y-auto">
                            <h2 className="text-lg font-semibold text-white mb-4">Upload File</h2>
                            <UniversalUpload
                                {...(acceptedFileTypes && { accept: acceptedFileTypes })}
                                {...(supportedFormats && { supportedFormats })}
                            />
                        </div>

                        {/* Preview Panel */}
                        <div className="bg-slate-900/50 overflow-hidden">
                            <FilePreview />
                        </div>
                    </div>

                    {/* Bottom Row - Controls & Output */}
                    <div className="flex-1 grid grid-cols-2 gap-px bg-slate-800/20 border-t border-white/5">
                        {/* Controls Panel */}
                        <div className="bg-slate-900/50 p-6 overflow-y-auto">
                            {controlsPanel}
                        </div>

                        {/* Output Panel */}
                        <div className="bg-slate-900/50 p-6 overflow-y-auto">
                            {outputPanel}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
