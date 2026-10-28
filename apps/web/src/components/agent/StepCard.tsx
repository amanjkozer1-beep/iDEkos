import React from 'react';
import {
  Check,
  X,
  RefreshCw,
  ShieldAlert,
  Clock,
  Terminal,
} from 'lucide-react';
import { AgentStep } from '../../store';

interface StepCardProps {
  step: AgentStep;
  index: number;
  onApprove?: (stepId: string) => void;
  onDeny?: (stepId: string) => void;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  onApprove,
  onDeny,
}) => {
  return (
    <div className="bg-[#050605] border border-white/10 rounded-2xl p-4 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5">
            {step.status === 'completed' ? (
              <div className="w-5 h-5 rounded-full bg-[#278E43]/20 text-[#28C840] flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
            ) : step.status === 'running' ? (
              <div className="w-5 h-5 rounded-full bg-[#FED100]/20 text-[#FED100] flex items-center justify-center">
                <RefreshCw className="w-3 h-3 stroke-[2.5] animate-spin" />
              </div>
            ) : step.status === 'waiting_approval' ? (
              <div className="w-5 h-5 rounded-full bg-[#FED100]/20 text-[#FED100] flex items-center justify-center ring-2 ring-[#FED100]/40 animate-pulse">
                <ShieldAlert className="w-3 h-3" />
              </div>
            ) : step.status === 'failed' ? (
              <div className="w-5 h-5 rounded-full bg-[#ED2024]/20 text-[#FF5F57] flex items-center justify-center">
                <X className="w-3 h-3 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/10 text-white/50 flex items-center justify-center">
                <Clock className="w-3 h-3" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8F968F] font-mono">
                Step {index + 1}
              </span>
              <span className="text-sm text-[#F5F4EF] font-medium">
                {step.title}
              </span>
            </div>

            {step.command && (
              <div className="mt-2 flex items-center gap-2 font-mono text-xs bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 text-[#FED100]/90">
                <Terminal className="w-3.5 h-3.5 text-[#8F968F]" />
                <span>{step.command}</span>
              </div>
            )}

            {step.details && (
              <p className="mt-2 text-xs text-[#8F968F] leading-relaxed">
                {step.details}
              </p>
            )}

            {step.diffSummary && (
              <div className="mt-2 text-xs font-mono text-[#28C840] bg-[#278E43]/10 px-2 py-1 rounded inline-block self-start border border-[#278E43]/20">
                {step.diffSummary}
              </div>
            )}
          </div>
        </div>

        {/* Human-in-the-loop approvals */}
        {(step.status === 'waiting_approval' || (step.requiresApproval && step.status === 'running')) && (
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            {onApprove && (
              <button
                onClick={() => onApprove(step.id)}
                className="px-2.5 py-1 rounded-lg bg-[#278E43]/20 hover:bg-[#278E43]/40 text-[#28C840] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            )}
            {onDeny && (
              <button
                onClick={() => onDeny(step.id)}
                className="px-2.5 py-1 rounded-lg bg-[#ED2024]/20 hover:bg-[#ED2024]/40 text-[#FF5F57] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Deny</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
