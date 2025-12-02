'use client';

import { usePathname } from 'next/navigation';
import { AISidebar } from '@/components/AISidebar';
import { AIHistoryProvider } from '@/context/AIHistoryContext';
import { ToastProvider } from '@/components/Toast';

export default function AIWorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isMainPage = pathname === '/ai-workspace';

    // Main AI workspace page - no sidebar, normal layout with header
    if (isMainPage) {
        return (
            <div className="tool-page min-h-screen">
                {children}
            </div>
        );
    }

    // Tool pages - full viewport height (no header), with sidebar
    return (
        <AIHistoryProvider>
            <ToastProvider>
                <div className="tool-page h-screen flex overflow-hidden">
                    <AISidebar />
                    <main className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                        {children}
                    </main>
                </div>
            </ToastProvider>
        </AIHistoryProvider>
    );
}
