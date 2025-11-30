'use client';

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface WorkflowItem {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  timestamp: string;
  type: string;
}

const mockWorkflows: WorkflowItem[] = [
  { id: '1', title: 'PDF Compression', status: 'completed', timestamp: '2 min ago', type: 'pdf' },
  { id: '2', title: 'AI Summary Generation', status: 'in_progress', timestamp: 'Just now', type: 'ai' },
  { id: '3', title: 'Image Optimization', status: 'completed', timestamp: '5 min ago', type: 'media' },
  { id: '4', title: 'Document Translation', status: 'pending', timestamp: 'Queued', type: 'ai' },
];

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  in_progress: { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

const WorkflowStream = memo(function WorkflowStream() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(mockWorkflows);

  return (
    <div className="space-y-5 rounded-[2.75rem] border border-white/12 bg-white/[0.08] p-6 shadow-[0_40px_100px_-65px_rgba(14,165,233,0.65)] backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Activity Stream</h2>
            <p className="text-sm text-white/50">Real-time workflow updates</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-400">Live</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 rounded-2xl bg-white/5 p-4">
        {[
          { label: 'Today', value: '12', icon: FileText },
          { label: 'Active', value: '3', icon: Zap },
          { label: 'Success Rate', value: '98%', icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/50 mb-1">
              <stat.icon className="h-3 w-3" />
              <span className="text-xs">{stat.label}</span>
            </div>
            <span className="text-lg font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Workflow List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {workflows.map((workflow, index) => {
            const status = statusConfig[workflow.status];
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-center gap-4 rounded-2xl bg-white/5 p-4 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${status.bg}`}>
                  <StatusIcon className={`h-5 w-5 ${status.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{workflow.title}</h3>
                  <p className="text-xs text-white/50">{workflow.timestamp}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                  {workflow.status.replace('_', ' ')}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* View All Link */}
      <Link
        href="/dashboard/history"
        className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
      >
        View All Activity
      </Link>
    </div>
  );
});

export default WorkflowStream;
