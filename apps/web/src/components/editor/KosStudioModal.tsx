import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Code2,
  Terminal as TerminalIcon,
  Check,
  ShieldCheck,
  Save,
  Search,
  AlertTriangle,
  GitBranch,
  AlignLeft,
  FileSearch,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { SunMark } from '../ui/SunMark';
import { FlagStripe } from '../ui/FlagStripe';
import { FileTree } from './FileTree';
import { MonacoEditor } from './MonacoEditor';
import { Terminal } from './Terminal';

type BottomTab = 'terminal' | 'problems' | 'search' | 'git';

export const KosStudioModal: React.FC = () => {
  const {
    studioOpen,
    setStudioOpen,
    workspaceTree,
    selectedStudioFile,
    selectedFileContent,
    selectStudioFile,
    updateFileContent,
    saveStudioFile,
    unsavedFiles,
    createWorkspaceItem,
    deleteWorkspaceItem,
    searchWorkspace,
    gitStatusFiles,
    fetchGitStatus,
    fetchWorkspaceTree,
    terminalLogs,
    runTerminalCommand,
    diagnosticsStatus,
    runDiagnosticsCheck,
    settings,
  } = useAppStore();

  const [openTabs, setOpenTabs] = useState<string[]>([
    'apps/web/src/App.tsx',
    'apps/api/src/server.ts',
  ]);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('terminal');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ file: string; line: number; content: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const editorRef = useRef<any>(null);

  const isCurrentFileDirty = !!unsavedFiles[selectedStudioFile];

  useEffect(() => {
    if (studioOpen) {
      fetchWorkspaceTree();
      fetchGitStatus();
      runDiagnosticsCheck();
    }
  }, [studioOpen, fetchWorkspaceTree, fetchGitStatus, runDiagnosticsCheck]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudioFile, unsavedFiles, selectedFileContent]);

  if (!studioOpen) return null;

  const handleOpenFile = (path: string, line?: number, col?: number) => {
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
    selectStudioFile(path);

    if (line && editorRef.current) {
      setTimeout(() => {
        editorRef.current?.revealLineInCenter(line);
        editorRef.current?.setPosition({ lineNumber: line, column: col || 1 });
        editorRef.current?.focus();
      }, 150);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t !== path);
    setOpenTabs(remaining);
    if (selectedStudioFile === path && remaining.length > 0) {
      selectStudioFile(remaining[remaining.length - 1]);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    await saveStudioFile(selectedStudioFile);
    await fetchGitStatus();
    setIsSaving(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    const results = await searchWorkspace(searchQuery.trim());
    setSearchResults(results);
    setIsSearching(false);
  };

  const problemsCount = diagnosticsStatus?.problemsCount || 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="K.O.S Studio Workspace"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="w-full h-full max-w-7xl max-h-[920px] bg-[#0B0E0C] border border-white/10 rounded-[24px] shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden relative">
        <FlagStripe height={3} />

        {/* Titlebar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#141A16] select-none">
          <div className="flex items-center gap-3">
            <SunMark variant="icon" size={20} />
            <span className="text-sm font-medium text-white tracking-tight">
              K.O.S Studio — Autonomous Clean Architecture IDE
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#278E43]/20 text-[#28C840] border border-[#278E43]/40 font-mono">
              ENGINE: {settings.model}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-mono">
              AUTONOMY: {settings.autonomyLevel.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !isCurrentFileDirty}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isCurrentFileDirty
                  ? 'bg-[#FED100] text-black hover:bg-[#ffe14d]'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 cursor-not-allowed'
              }`}
              title="Save File (Cmd+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save File'}</span>
            </button>

            <button
              onClick={runDiagnosticsCheck}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#A5ABA5] hover:text-white transition-colors cursor-pointer"
              title="Run compiler & linter checks"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#28C840]" />
              <span>Verify Codebase</span>
            </button>

            <button
              onClick={() => setStudioOpen(false)}
              aria-label="Close K.O.S Studio"
              className="p-1.5 rounded-lg text-[#8F968F] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree Component */}
          <FileTree
            tree={workspaceTree}
            selectedFile={selectedStudioFile}
            unsavedFiles={unsavedFiles}
            gitStatusFiles={gitStatusFiles}
            onSelectFile={handleOpenFile}
            onCreateItem={createWorkspaceItem}
            onDeleteItem={deleteWorkspaceItem}
            onRefresh={fetchWorkspaceTree}
          />

          {/* Monaco Editor Container */}
          <div className="flex-1 flex flex-col bg-[#050605] overflow-hidden">
            {/* Multi-tab bar */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0B0E0C] px-2 select-none overflow-x-auto">
              <div className="flex items-center gap-1">
                {openTabs.map((tab) => {
                  const isActive = selectedStudioFile === tab;
                  const isDirty = !!unsavedFiles[tab];
                  const filename = tab.split('/').pop() || tab;
                  return (
                    <div
                      key={tab}
                      onClick={() => handleOpenFile(tab)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-mono cursor-pointer transition-colors border-t-2 ${
                        isActive
                          ? 'bg-[#0B0E0C] border-[#FED100] text-white font-medium'
                          : 'bg-[#0E1310] border-transparent text-[#8F968F] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Code2
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-[#FED100]' : 'text-[#8F968F]'
                        }`}
                      />
                      <span className="truncate max-w-[150px]">{filename}</span>
                      {isDirty && (
                        <span className="w-2 h-2 rounded-full bg-[#FED100]" title="Unsaved changes" />
                      )}
                      <button
                        onClick={(e) => handleCloseTab(e, tab)}
                        className="hover:text-red-400 p-0.5 rounded cursor-pointer ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pr-2 font-mono text-[11px]">
                {isCurrentFileDirty && (
                  <span className="text-[#FED100] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FED100] animate-pulse" />
                    Unsaved
                  </span>
                )}
                {diagnosticsStatus && (
                  <div
                    onClick={() => setActiveBottomTab('problems')}
                    className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded ${
                      diagnosticsStatus.success
                        ? 'text-[#28C840] hover:bg-[#28C840]/10'
                        : 'text-[#FF5F57] hover:bg-[#FF5F57]/10'
                    }`}
                  >
                    {diagnosticsStatus.success ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    <span>
                      {diagnosticsStatus.success
                        ? '0 Problems'
                        : `${problemsCount} Problem${problemsCount === 1 ? '' : 's'}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 relative">
              <MonacoEditor
                filePath={selectedStudioFile}
                content={selectedFileContent}
                onChange={(val) => updateFileContent(selectedStudioFile, val)}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
              />
            </div>

            {/* Bottom Panel */}
            <div className="h-56 border-t border-white/10 bg-[#000000] flex flex-col font-mono text-xs select-text">
              <div className="flex items-center justify-between px-3 bg-[#0A0D0B] border-b border-white/5 select-none">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveBottomTab('terminal')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors cursor-pointer border-b-2 ${
                      activeBottomTab === 'terminal'
                        ? 'border-[#28C840] text-white font-medium bg-black/40'
                        : 'border-transparent text-[#8F968F] hover:text-white'
                    }`}
                  >
                    <TerminalIcon className="w-3.5 h-3.5 text-[#28C840]" />
                    <span>Terminal</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveBottomTab('problems');
                      runDiagnosticsCheck();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors cursor-pointer border-b-2 ${
                      activeBottomTab === 'problems'
                        ? 'border-[#FF5F57] text-white font-medium bg-black/40'
                        : 'border-transparent text-[#8F968F] hover:text-white'
                    }`}
                  >
                    <AlertTriangle className={`w-3.5 h-3.5 ${problemsCount > 0 ? 'text-[#FF5F57]' : 'text-[#8F968F]'}`} />
                    <span>Problems ({problemsCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveBottomTab('search')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors cursor-pointer border-b-2 ${
                      activeBottomTab === 'search'
                        ? 'border-[#FED100] text-white font-medium bg-black/40'
                        : 'border-transparent text-[#8F968F] hover:text-white'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-[#FED100]" />
                    <span>Find in Files</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveBottomTab('git');
                      fetchGitStatus();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors cursor-pointer border-b-2 ${
                      activeBottomTab === 'git'
                        ? 'border-[#FED100] text-white font-medium bg-black/40'
                        : 'border-transparent text-[#8F968F] hover:text-white'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5 text-[#FED100]" />
                    <span>Source Control ({gitStatusFiles.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[#8F968F]">
                  <span>sandbox: hardened clean root</span>
                  <span className="text-[#28C840] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#28C840] animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>

              {activeBottomTab === 'terminal' && (
                <Terminal logs={terminalLogs} onExecute={runTerminalCommand} />
              )}

              {activeBottomTab === 'problems' && (
                <div className="flex-1 p-3 overflow-y-auto sidebar-scrollbar flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[#8F968F] text-[11px] border-b border-white/5 pb-1">
                    <span>Clean TypeScript Diagnostics</span>
                    <button
                      onClick={runDiagnosticsCheck}
                      className="flex items-center gap-1 text-[#FED100] hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Re-analyze</span>
                    </button>
                  </div>

                  {diagnosticsStatus?.problems && diagnosticsStatus.problems.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {diagnosticsStatus.problems.map((prob, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleOpenFile(prob.file, prob.line, prob.col)}
                          className="flex items-start gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer text-xs transition-colors"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-[#FF5F57] shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{prob.file}</span>
                              <span className="text-[#FED100]">[{prob.line}:{prob.col}]</span>
                              <span className="text-[#8F968F]">{prob.code}</span>
                            </div>
                            <div className="text-[#A5ABA5] mt-0.5">{prob.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 text-[#28C840] text-xs">
                      <Check className="w-4 h-4" />
                      <span>Zero diagnostics errors detected. Codebase is clean.</span>
                    </div>
                  )}
                </div>
              )}

              {activeBottomTab === 'search' && (
                <div className="flex-1 p-3 flex flex-col overflow-hidden">
                  <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <Search className="w-3.5 h-3.5 text-[#FED100]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search text across workspace..."
                      className="flex-1 bg-black/40 border border-white/10 rounded px-2.5 py-1 text-white text-xs outline-none focus:border-[#FED100]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="px-3 py-1 bg-[#278E43] hover:bg-[#28C840] text-black font-semibold rounded text-xs cursor-pointer flex items-center gap-1"
                    >
                      {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      <span>Find</span>
                    </button>
                  </form>

                  <div className="flex-1 overflow-y-auto mt-2 sidebar-scrollbar">
                    {searchResults.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] text-[#8F968F] mb-1">
                          Found {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}:
                        </div>
                        {searchResults.map((res, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleOpenFile(res.file, res.line)}
                            className="flex items-start gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer text-xs"
                          >
                            <FileSearch className="w-3.5 h-3.5 text-[#FED100] shrink-0 mt-0.5" />
                            <div className="flex-1 truncate">
                              <span className="text-white font-medium">{res.file}</span>
                              <span className="text-[#FED100] ml-2">line {res.line}</span>
                              <div className="text-[#8F968F] truncate mt-0.5 font-mono">{res.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery && !isSearching ? (
                      <div className="text-xs text-[#8F968F] p-2">No matching strings found.</div>
                    ) : (
                      <div className="text-xs text-[#555C56] p-2">Enter a query to search across all project files.</div>
                    )}
                  </div>
                </div>
              )}

              {activeBottomTab === 'git' && (
                <div className="flex-1 p-3 overflow-y-auto sidebar-scrollbar flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[#8F968F] text-[11px] border-b border-white/5 pb-1">
                    <span>Working Tree Status</span>
                    <button
                      onClick={fetchGitStatus}
                      className="flex items-center gap-1 text-[#FED100] hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {gitStatusFiles.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {gitStatusFiles.map((fileObj, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleOpenFile(fileObj.file)}
                          className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1 rounded text-[10px] font-bold ${
                                fileObj.status === 'M'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : fileObj.status === '?' || fileObj.status === '??'
                                  ? 'bg-[#FED100]/20 text-[#FED100]'
                                  : 'bg-green-500/20 text-green-400'
                              }`}
                            >
                              {fileObj.status}
                            </span>
                            <span className="text-white truncate">{fileObj.file}</span>
                          </div>
                          <span className="text-[#8F968F] text-[10px]">Click to open</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 text-[#28C840] text-xs">
                      <Check className="w-4 h-4" />
                      <span>Working tree clean.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
