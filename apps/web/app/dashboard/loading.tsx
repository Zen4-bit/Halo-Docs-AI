import ToolCardSkeleton from '@/components/ToolCardSkeleton';

export default function DashboardLoading() {
  return (
    <div className="container pb-24 pt-12">
      <div className="mb-12 space-y-3">
        <div className="h-6 w-32 rounded-full bg-white/10" />
        <div className="h-10 w-full max-w-lg rounded-full bg-white/12" />
        <div className="h-4 w-full max-w-xl rounded-full bg-white/8" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ToolCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

