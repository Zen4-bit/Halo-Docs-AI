'use client';

export default function ToolCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-xl bg-white/10" />
          <div className="h-5 w-5 rounded bg-white/5" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded-full bg-white/10" />
          <div className="h-4 w-full rounded-full bg-white/5" />
        </div>
      </div>
    </div>
  );
}
