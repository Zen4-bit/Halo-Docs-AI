import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AIWorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Back Button */}
            <div className="border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link
                        href="/ai-workspace"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to AI Workspace</span>
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            {children}
        </div>
    );
}
