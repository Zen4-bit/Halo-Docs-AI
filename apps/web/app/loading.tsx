import { PageLoadingOverlay } from '@/components/PageLoading';

export default function RootLoading() {
  return (
    <PageLoadingOverlay
      label="Loading Halo Docs AI"
      description="Preparing your workspace..."
    />
  );
}

