import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileCode,
  ShieldAlert,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAppStore, TaskItem } from '../../store';
import { StepCard } from './StepCard';

interface TaskExecutionViewProps {
  task: TaskItem;
  onBack: () => void;
}

export const TaskExecutionView: React.FC<TaskExecutionViewProps> = ({
  task,
  onBack,
}) => {
  const { approveStep, denyStep, setStudioOpen } = useAppStore();

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-6 py-8 overflow-y-auto z-10">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10 select-none">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#8F968F] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Composer</span>
        </button>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
              task.status === 'completed'
                ? 'bg-[#278E43]/20 text-[#28C840] border border-[#278E43]/40'
                : task.status === 'failed'
                ? 'bg-[#ED2024]/20 text-[#FF5F57] border border-[#ED2024]/40'
                : task.status === 'waiting_approval'
                ? 'bg-[#FED100]/20 text-[#FED100] border border-[#FED100]/40 animate-pulse'
                : 'bg-[#FED100]/20 text-[#FED100] border border-[#FED100]/40'
            }`}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : task.status === 'failed' ? (
              <X className="w-3.5 h-3.5" />
            ) : task.status === 'waiting_approval' ? (
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            )}
            <span className="capitalize">{task.status.replace('_', ' ')}</span>
          </span>

          <button
            onClick={() => setStudioOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-white transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FED100]" />
            <span>Open in K.O.S Studio</span>
          </button>
        </div>
      </div>

      {/* Task Heading */}
      <div className="mt-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#8F968F]">
          <span>TASK ID: {task.id}</span>
          <span>•</span>
          <span>{task.createdAt}</span>
          <span>•</span>
          <span className="uppercase text-[#FED100]">{task.mode} MODE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#F5F4EF] mt-2 tracking-tight">
          {task.title}
        </h1>
        <p className="text-sm text-[#A5ABA5] mt-2 font-normal max-w-3xl bg-black/40 border border-white/5 p-3.5 rounded-2xl">
          {task.prompt}
        </p>
      </div>

      {/* Steps List */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-[#8F968F] font-semibold flex items-center gap-2">
            <span>Execution Plan & Sub-tasks</span>
            <span className="text-white/40">({task.steps.length} steps)</span>
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {task.steps.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              index={idx}
              onApprove={(stepId) => approveStep(task.id, stepId)}
              onDeny={(stepId) => denyStep(task.id, stepId)}
            />
          ))}
        </div>
      </div>

      {/* Generated Artifacts */}
      {task.artifacts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-wider text-[#8F968F] font-semibold mb-3">
            Generated Artifacts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {task.artifacts.map((art) => (
              <div
                key={art.id}
                className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#FED100]">
                    <FileCode className="w-4 h-4" />
                    <span>{art.title}</span>
                  </div>
                  {art.size && (
                    <span className="text-[10px] text-[#8F968F]">{art.size}</span>
                  )}
                </div>
                <pre className="text-xs font-mono text-[#A5ABA5] bg-black/80 p-3 rounded-xl overflow-x-auto border border-white/5">
                  {art.preview}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
