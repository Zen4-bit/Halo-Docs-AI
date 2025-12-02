'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { PageLoadingOverlay } from '@/components/PageLoading';
import PageTransition from '@/components/PageTransition';

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const pathname = usePathname();
  
  // Check if we're inside an AI Workspace tool (not the main AI workspace page)
  const isAIWorkspaceTool = pathname.startsWith('/ai-workspace/') && pathname !== '/ai-workspace';
  
  // Check if we're on a utility tool page (PDF Tools, Office Tools, Media Tools)
  const isUtilityToolPage = pathname.startsWith('/tools/') && pathname !== '/tools';
  
  // Remove top padding when navigation is hidden
  const hideNavPadding = isAIWorkspaceTool || isUtilityToolPage;
  
  return (
    <main 
      id="main-content" 
      className={`flex-1 ${hideNavPadding ? '' : 'pt-20'}`}
    >
      <Suspense fallback={<PageLoadingOverlay label="Loading page" />}>
        <PageTransition>{children}</PageTransition>
      </Suspense>
    </main>
  );
}
