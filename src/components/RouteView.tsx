import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Image as ImageIcon,
  Clock,
  Sun,
  Settings,
  Film,
  ArrowLeft,
  ShieldCheck,
  Cpu,
  Sliders,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  Play,
  Copy,
  Terminal,
} from 'lucide-react';
import { useAppStore, NavRoute } from '../store/useAppStore';
import { SunMark } from './SunMark';

interface RouteViewProps {
  route: NavRoute;
  onBack: () => void;
}

export const RouteView: React.FC<RouteViewProps> = ({ route, onBack }) => {
  const {
    settings,
    updateSettings,
    runDiagnosticsCheck,
    diagnosticsStatus,
    libraryItems,
    fetchLibrary,
    addLibraryItem,
    deleteLibraryItem,
    scheduledTasks,
    fetchScheduled,
    addScheduledTask,
    toggleScheduledTask,
    deleteScheduledTask,
    runScheduledTaskNow,
    images,
    fetchImages,
    addImageItem,
    deleteImageItem,
    dailyBrief,
    fetchDailyBrief,
  } = useAppStore();

  // Local state for forms and filters
  const [libSearch, setLibSearch] = useState('');
  const [showAddLib, setShowAddLib] = useState(false);
  const [newLibTitle, setNewLibTitle] = useState('');
  const [newLibCategory, setNewLibCategory] = useState('');
  const [newLibContent, setNewLibContent] = useState('');

  const [showAddSched, setShowAddSched] = useState(false);
  const [newSchedTitle, setNewSchedTitle] = useState('');
  const [newSchedCron, setNewSchedCron] = useState('0 0 * * *');
  const [newSchedCmd, setNewSchedCmd] = useState('');
  const [runningSchedId, setRunningSchedId] = useState<string | null>(null);

  const [showAddImage, setShowAddImage] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const [newImageData, setNewImageData] = useState('');

  useEffect(() => {
    if (route === 'library') fetchLibrary();
    if (route === 'scheduled') fetchScheduled();
    if (route === 'images') fetchImages();
    if (route === 'daily-brief') fetchDailyBrief();
  }, [route]);

  // -------------------------------------------------------------
  // CUSTOMIZE / SETTINGS ROUTE
  // -------------------------------------------------------------
  if (route === 'customize') {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8 overflow-y-auto z-10 select-none">
        <div className="pb-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#8F968F] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>
          <span className="text-xs font-mono text-[#FED100]">
            K.O.S AGENT SETTINGS
          </span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10">
            <Settings className="w-8 h-8 text-[#FED100]" />
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

        {/* Section 3: Closed-Loop Verification Suite */}
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
  }

  // -------------------------------------------------------------
  // LIBRARY ROUTE (Persistent SQLite)
  // -------------------------------------------------------------
  if (route === 'library') {
    const filtered = libraryItems.filter(
      (item) =>
        item.title.toLowerCase().includes(libSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(libSearch.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8 overflow-y-auto z-10 select-none">
        <div className="pb-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#8F968F] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>
          <button
            onClick={() => setShowAddLib(!showAddLib)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#278E43]/20 hover:bg-[#278E43]/30 text-[#28C840] border border-[#278E43]/40 text-xs font-medium cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Snippet</span>
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10">
            <LayoutGrid className="w-8 h-8 text-[#FED100]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-[#F5F4EF]">Library</h1>
            <p className="text-xs text-[#8F968F] mt-1">
              Reusable code snippets, templates, and agent modules stored persistently in SQLite.
            </p>
          </div>
        </div>

        {/* Inline Add Form */}
        {showAddLib && (
          <div className="mt-6 p-4 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#FED100]">
                New Library Snippet
              </span>
              <button
                onClick={() => setShowAddLib(false)}
                className="text-xs text-[#8F968F] hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Title (e.g. Reducer Hook)"
                value={newLibTitle}
                onChange={(e) => setNewLibTitle(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FED100]"
              />
              <input
                type="text"
                placeholder="Category (e.g. State / Hooks)"
                value={newLibCategory}
                onChange={(e) => setNewLibCategory(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FED100]"
              />
            </div>
            <textarea
              placeholder="Code or snippet content..."
              rows={4}
              value={newLibContent}
              onChange={(e) => setNewLibContent(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-[#FED100]"
            />
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  if (!newLibTitle.trim() || !newLibContent.trim()) return;
                  await addLibraryItem(newLibTitle, newLibCategory, newLibContent);
                  setNewLibTitle('');
                  setNewLibCategory('');
                  setNewLibContent('');
                  setShowAddLib(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#FED100] text-black font-medium text-xs hover:bg-[#FED100]/90 transition-colors cursor-pointer"
              >
                Save to Database
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="w-4 h-4 text-[#8F968F] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search library items..."
            value={libSearch}
            onChange={(e) => setLibSearch(e.target.value)}
            className="w-full bg-[#050605] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-white/20"
          />
        </div>

        {/* Items Grid */}
        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <SunMark variant="small" size={24} />
              <p className="text-xs text-[#8F968F]">No library items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#050605] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-white group-hover:text-[#FED100] transition-colors">
                        {item.title}
                      </span>
                      <button
                        onClick={() => deleteLibraryItem(item.id)}
                        className="text-[#8F968F] hover:text-red-400 p-1 transition-colors cursor-pointer"
                        title="Delete snippet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] text-[#FED100]/80 font-mono inline-block mt-1">
                      {item.category}
                    </span>
                    <pre className="mt-3 p-2.5 rounded-lg bg-black/60 text-[11px] font-mono text-[#A5ABA5] overflow-x-auto max-h-32">
                      {item.content}
                    </pre>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#8F968F]">
                    <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.content)}
                      className="flex items-center gap-1 hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCHEDULED TASKS ROUTE (Persistent SQLite)
  // -------------------------------------------------------------
  if (route === 'scheduled') {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8 overflow-y-auto z-10 select-none">
        <div className="pb-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#8F968F] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>
          <button
            onClick={() => setShowAddSched(!showAddSched)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#278E43]/20 hover:bg-[#278E43]/30 text-[#28C840] border border-[#278E43]/40 text-xs font-medium cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Task</span>
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10">
            <Clock className="w-8 h-8 text-[#FED100]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-[#F5F4EF]">
              Scheduled Tasks
            </h1>
            <p className="text-xs text-[#8F968F] mt-1">
              Autonomous cron executions and sandboxed integrity sweeps persisted in SQLite.
            </p>
          </div>
        </div>

        {/* Inline Add Task Form */}
        {showAddSched && (
          <div className="mt-6 p-4 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#FED100]">
                New Scheduled Task
              </span>
              <button
                onClick={() => setShowAddSched(false)}
                className="text-xs text-[#8F968F] hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Title (e.g. Nightly Audit)"
                value={newSchedTitle}
                onChange={(e) => setNewSchedTitle(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FED100]"
              />
              <input
                type="text"
                placeholder="Cron (e.g. 0 0 * * *)"
                value={newSchedCron}
                onChange={(e) => setNewSchedCron(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#FED100]"
              />
            </div>
            <input
              type="text"
              placeholder="Shell Command (e.g. git status)"
              value={newSchedCmd}
              onChange={(e) => setNewSchedCmd(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#FED100]"
            />
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  if (!newSchedTitle.trim() || !newSchedCmd.trim()) return;
                  await addScheduledTask(newSchedTitle, newSchedCron, newSchedCmd);
                  setNewSchedTitle('');
                  setNewSchedCmd('');
                  setShowAddSched(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#FED100] text-black font-medium text-xs hover:bg-[#FED100]/90 transition-colors cursor-pointer"
              >
                Schedule Task
              </button>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="mt-6 flex flex-col gap-3">
          {scheduledTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <SunMark variant="small" size={24} />
              <p className="text-xs text-[#8F968F]">No scheduled tasks found.</p>
            </div>
          ) : (
            scheduledTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-[#050605] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleScheduledTask(t.id, !t.enabled)}
                    className={`mt-0.5 w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                      t.enabled ? 'bg-[#278E43]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        t.enabled ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <div>
                    <span className="text-sm font-medium text-white block">
                      {t.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[#8F968F]">
                      <span className="text-[#FED100]">{t.cron_schedule}</span>
                      <span>•</span>
                      <span className="text-[#A5ABA5]">{t.command}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-[11px] font-mono">
                    <span className="text-[#8F968F] block">Last Run: {t.last_run || 'Never'}</span>
                    <span className={t.last_status === 'Passed' || t.last_status === 'Clean' ? 'text-[#28C840]' : 'text-[#FED100]'}>
                      {t.last_status || 'Pending'}
                    </span>
                  </div>

                  <button
                    onClick={async () => {
                      setRunningSchedId(t.id);
                      await runScheduledTaskNow(t.id);
                      setRunningSchedId(null);
                    }}
                    disabled={runningSchedId === t.id}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer disabled:opacity-50"
                    title="Run Now in Sandbox"
                  >
                    <Play className={`w-3.5 h-3.5 text-[#28C840] ${runningSchedId === t.id ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => deleteScheduledTask(t.id)}
                    className="p-2 rounded-xl text-[#8F968F] hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // IMAGES ROUTE (Persistent SQLite)
  // -------------------------------------------------------------
  if (route === 'images') {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8 overflow-y-auto z-10 select-none">
        <div className="pb-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#8F968F] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>
          <button
            onClick={() => setShowAddImage(!showAddImage)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#278E43]/20 hover:bg-[#278E43]/30 text-[#28C840] border border-[#278E43]/40 text-xs font-medium cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10">
            <ImageIcon className="w-8 h-8 text-[#28C840]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-[#F5F4EF]">
              Images & Assets
            </h1>
            <p className="text-xs text-[#8F968F] mt-1">
              Visual assets and system watermarks stored persistently in SQLite.
            </p>
          </div>
        </div>

        {/* Inline Add Image Form */}
        {showAddImage && (
          <div className="mt-6 p-4 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#FED100]">
                Save New Asset
              </span>
              <button
                onClick={() => setShowAddImage(false)}
                className="text-xs text-[#8F968F] hover:text-white"
              >
                Cancel
              </button>
            </div>
            <input
              type="text"
              placeholder="Asset Name (e.g. app-emblem.svg)"
              value={newImageName}
              onChange={(e) => setNewImageName(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FED100]"
            />
            <textarea
              placeholder="Paste Data URI or SVG markup..."
              rows={3}
              value={newImageData}
              onChange={(e) => setNewImageData(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-[#FED100]"
            />
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  if (!newImageName.trim() || !newImageData.trim()) return;
                  await addImageItem(newImageName, newImageData, 1.2);
                  setNewImageName('');
                  setNewImageData('');
                  setShowAddImage(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#FED100] text-black font-medium text-xs hover:bg-[#FED100]/90 transition-colors cursor-pointer"
              >
                Save Asset
              </button>
            </div>
          </div>
        )}

        {/* Images Grid */}
        <div className="mt-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <SunMark variant="small" size={24} />
              <p className="text-xs text-[#8F968F]">No image assets saved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="p-4 rounded-2xl bg-[#050605] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all group"
                >
                  <div className="h-28 rounded-xl bg-black/60 flex items-center justify-center overflow-hidden border border-white/5 relative">
                    <img
                      src={img.data_url}
                      alt={img.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-white block truncate max-w-[150px]">
                        {img.name}
                      </span>
                      <span className="text-[10px] text-[#8F968F]">
                        {img.size_kb} KB
                      </span>
                    </div>
                    <button
                      onClick={() => deleteImageItem(img.id)}
                      className="text-[#8F968F] hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DAILY BRIEF ROUTE (Persistent SQLite Stats)
  // -------------------------------------------------------------
  if (route === 'daily-brief') {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8 overflow-y-auto z-10 select-none">
        <div className="pb-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#8F968F] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>
          <span className="text-xs font-mono text-[#FED100]">
            {dailyBrief?.date || 'Today'}
          </span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10">
            <Sun className="w-8 h-8 text-[#FED100]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-[#F5F4EF]">
              Daily Brief
            </h1>
            <p className="text-xs text-[#8F968F] mt-1">
              High-level operational intelligence and real execution telemetry from SQLite.
            </p>
          </div>
        </div>

        {/* Real Stats Metrics */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#050605] border border-white/10 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8F968F]">
              Tasks Completed
            </span>
            <span className="text-3xl font-light text-[#28C840] mt-3">
              {dailyBrief ? dailyBrief.tasksCompleted : 0}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#050605] border border-white/10 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8F968F]">
              Tasks Failed
            </span>
            <span className="text-3xl font-light text-[#FF5F57] mt-3">
              {dailyBrief ? dailyBrief.tasksFailed : 0}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#050605] border border-white/10 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8F968F]">
              Total Steps Executed
            </span>
            <span className="text-3xl font-light text-[#FED100] mt-3">
              {dailyBrief ? dailyBrief.totalSteps : 0}
            </span>
          </div>
        </div>

        {/* System Health */}
        <div className="mt-6 p-5 rounded-2xl bg-[#050605] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-white">System Integrity</span>
            <p className="text-xs text-[#8F968F] mt-0.5">
              Live health status calculated from SQLite task records.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#278E43]/20 text-[#28C840] border border-[#278E43]/40">
            {dailyBrief?.systemHealth || 'Optimal (100% healthy)'}
          </span>
        </div>

        {/* Recent Headlines */}
        <div className="mt-6 flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8F968F]">
            Recent Headlines & Activity
          </span>
          {dailyBrief && dailyBrief.recentHeadlines.length > 0 ? (
            <div className="flex flex-col gap-2">
              {dailyBrief.recentHeadlines.map((headline, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#050605] border border-white/5 text-xs text-white flex items-center gap-3"
                >
                  <SunMark variant="small" size={16} />
                  <span>{headline}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <SunMark variant="small" size={24} />
              <p className="text-xs text-[#8F968F]">
                Workspace initialized. Ready for autonomous tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIDEOS ROUTE
  // -------------------------------------------------------------
  if (route === 'videos') {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8 overflow-y-auto z-10 select-none">
        <div className="pb-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#8F968F] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10">
            <Film className="w-8 h-8 text-[#ED2024]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-[#F5F4EF]">
              Videos & Screen Recordings
            </h1>
            <p className="text-xs text-[#8F968F] mt-1">
              Autonomous agent session recordings and verification replays.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#050605] border border-white/10 flex flex-col justify-between">
            <span className="text-sm font-medium text-white">
              Desktop Shell Verification Session
            </span>
            <span className="text-xs text-[#8F968F] mt-3 font-mono">
              Playwright CLI
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#050605] border border-white/10 flex flex-col justify-between">
            <span className="text-sm font-medium text-white">
              Composer Interaction Flow Walkthrough
            </span>
            <span className="text-xs text-[#8F968F] mt-3 font-mono">
              Demo
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
