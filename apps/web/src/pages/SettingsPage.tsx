import React from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Cpu,
  ShieldCheck,
  Check,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '../store';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    runDiagnosticsCheck,
    diagnosticsStatus,
    setCurrentRoute,
  } = useAppStore();

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8 overflow-y-auto z-10 select-none">
      {/* Top action row */}
      <div className="pb-4 border-b border-white/10 flex items-center justify-between">
        <button
          onClick={() => setCurrentRoute('new-chat')}
          className="flex items-center gap-2 text-sm text-[#8F968F] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </button>
        <span className="text-xs font-mono text-[#FED100]">
          K.O.S AGENT SETTINGS
        </span>
      </div>

      {/* Header */}
      <div className="mt-6 flex items-center gap-4">
        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10">
          <SettingsIcon className="w-8 h-8 text-[#FED100]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#F5F4EF]">
            K.O.S System Settings & Architecture
          </h1>
          <p className="text-xs text-[#8F968F] mt-1">
            Configure Autonomous Agent Harness, model engine parameters, and sandbox rules.
          </p>
        </div>
      </div>

      {/* Section 1: Autonomy Level */}
      <div className="mt-8 flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#8F968F] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#FED100]" />
          <span>Agent Autonomy Level (Control Loop)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'human_approval',
              title: 'Human In The Loop',
              desc: 'Requires explicit developer approval before diffs or shell commands run.',
            },
            {
              id: 'full_auto',
              title: 'Full Autonomous ReAct',
              desc: 'Agent plans, inspects AST, applies patches, and self-corrects automatically.',
            },
            {
              id: 'read_only',
              title: 'Advisory / Read Only',
              desc: 'Agent explores and plans without modifying disk or terminal.',
            },
          ].map((opt) => {
            const isSelected = settings.autonomyLevel === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() =>
                  updateSettings({
                    autonomyLevel: opt.id as any,
                  })
                }
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-black/80 border-[#FED100] text-white shadow-lg'
                    : 'bg-white/[0.02] border-white/5 text-[#A5ABA5] hover:bg-white/[0.05]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{opt.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#FED100]" />}
                  </div>
                  <p className="text-xs text-[#8F968F] mt-2 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Model Provider & Context Caching */}
      <div className="mt-8 flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#8F968F] flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#28C840]" />
          <span>Model Provider & Context Caching</span>
        </label>
        <div className="p-5 rounded-2xl bg-[#050605] border border-white/10 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-white">
                Model Provider
              </span>
              <p className="text-xs text-[#8F968F] mt-0.5">
                Select the underlying inference provider for the autonomous agent.
              </p>
            </div>
            <select
              value={settings.model}
              onChange={(e) => updateSettings({ model: e.target.value })}
              className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-[#FED100]"
            >
              <option value="standard-v1">Standard Inference Engine</option>
              <option value="google-provider">Google</option>
              <option value="ollama-provider">Ollama</option>
              <option value="custom-provider">Custom</option>
            </select>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-white">
                Context Caching
              </span>
              <p className="text-xs text-[#8F968F]">
                Caches project file AST and dependency graphs on server to reduce token latency by 75%.
              </p>
            </div>
            <button
              onClick={() =>
                updateSettings({
                  contextCaching: !settings.contextCaching,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.contextCaching ? 'bg-[#278E43]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.contextCaching ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Closed-Loop Verification */}
      <div className="mt-8 flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#8F968F] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#28C840]" />
          <span>Closed-Loop Diagnostics & Health Check</span>
        </label>
        <div className="p-5 rounded-2xl bg-[#050605] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-white">
              Live TypeScript & Linter Verification
            </span>
            <p className="text-xs text-[#8F968F] mt-0.5">
              Executes compiler diagnostics to verify zero regressions across the codebase.
            </p>
          </div>
          <button
            onClick={runDiagnosticsCheck}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FED100]" />
            <span>Run Diagnostic Check</span>
          </button>
        </div>

        {diagnosticsStatus && (
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono">
            <span className={diagnosticsStatus.success ? 'text-[#28C840]' : 'text-[#FF5F57]'}>
              {diagnosticsStatus.output}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
