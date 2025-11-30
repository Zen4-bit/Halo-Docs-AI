import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import ToolsCatalog from '@/components/ToolsCatalog';
import ToolCardSkeleton from '@/components/ToolCardSkeleton';

const WorkflowStream = dynamic(() => import('@/components/WorkflowStream'), {
  loading: () => (
    <div className="space-y-5 rounded-[2.75rem] border border-white/12 bg-white/[0.08] p-6 shadow-[0_40px_100px_-65px_rgba(14,165,233,0.65)] backdrop-blur-2xl">
      <div className="h-5 w-40 rounded-full bg-white/10" />
      <div className="h-8 w-3/4 rounded-full bg-white/12" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <ToolCardSkeleton key={index} />
        ))}
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'Dashboard · HALO Docs AI',
  description:
    'Start workflows, monitor live telemetry, and launch tools to automate your document lifecycle.',
};

export default function DashboardPage() {
  return (
    <div className="container pb-16 pt-24 sm:pb-20 sm:pt-28 md:pb-24 md:pt-32 max-w-[95%] xl:max-w-[90%]">
      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr] md:gap-8 lg:gap-10">
        <WorkflowStream />
        <div className="space-y-5 rounded-[2.75rem] border border-white/12 bg-white/[0.05] p-5 shadow-[0_45px_110px_-80px_rgba(99,102,241,0.6)] backdrop-blur-[22px] sm:space-y-6 sm:p-6">
          <ToolsCatalog
            heading={
              <>
                Welcome to <span className="text-gradient">HALO Docs AI</span>
              </>
            }
            subheading="Select a workflow to launch AI assistance, PDF finishing, or compliance guardrails."
          />
        </div>
      </div>
    </div>
  );
}
