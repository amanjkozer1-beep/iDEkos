/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Watermark } from './components/Watermark';
import { FlagStripe } from './components/FlagStripe';
import { Composer } from './components/Composer';
import { ModeSwitch } from './components/ModeSwitch';
import { TaskExecutionView } from './components/TaskExecutionView';
import { RouteView } from './components/RouteView';
import { SearchModal } from './components/SearchModal';
import { FolderPickerModal } from './components/FolderPickerModal';
import { KosStudioModal } from './components/KosStudioModal';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[K.O.S ErrorBoundary]: Caught UI defect:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#000000] flex items-center justify-center p-6 select-none">
          <div className="bg-[#141A16] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#ED2024]/20 text-[#FF5F57] flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-medium text-[#F5F4EF] mb-2">Desktop Session Recovered</h2>
            <p className="text-xs text-[#8F968F] mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering anomaly occurred. Your state has been preserved.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-full bg-[#FED100] text-black font-medium text-xs hover:bg-[#FED100]/90 transition-colors cursor-pointer"
            >
              Restart Session
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppContent() {
  const {
    currentRoute,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    isWindowExpanded,
    activeTaskId,
    tasks,
    resetToNewChat,
    setSearchOpen,
    searchOpen,
    morePopoverOpen,
    setMorePopoverOpen,
    accountMenuOpen,
    setAccountMenuOpen,
    setFolderPickerOpen,
    setAttachMenuOpen,
    fetchTasks,
  } = useAppStore();

  const [sidebarWidth, setSidebarWidth] = useState(330);
  const isDraggingSidebar = useRef(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Responsive: below 1100px width auto-collapse the sidebar to icons only
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  // Global Keyboard Shortcuts (Cmd+B, Cmd+K, Cmd+N, Esc)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        resetToNewChat();
      } else if (e.key === 'Escape') {
        if (morePopoverOpen) setMorePopoverOpen(false);
        if (accountMenuOpen) setAccountMenuOpen(false);
        if (searchOpen) setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [
    toggleSidebar,
    resetToNewChat,
    morePopoverOpen,
    setMorePopoverOpen,
    accountMenuOpen,
    setAccountMenuOpen,
    searchOpen,
    setSearchOpen,
  ]);

  // Handle draggable sidebar resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSidebar.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingSidebar.current) return;
      const newWidth = Math.min(Math.max(moveEvent.clientX, 280), 440);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingSidebar.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="w-screen h-screen bg-[#000000] flex items-center justify-center overflow-hidden p-0 sm:p-2 xl:p-4 select-none">
      {/* macOS-style Frameless Desktop Window */}
      <div
        className={`
          relative flex w-full h-full bg-[#0B0E0C] border border-[rgba(255,255,255,0.08)]
          shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-300
          ${
            isWindowExpanded
              ? 'rounded-none max-w-none max-h-none'
              : 'rounded-[22px] max-w-[1920px] max-h-[1200px]'
          }
        `}
      >
        {/* Under-titlebar hairline flag stripe matching the top edge */}
        <div className="absolute top-[4px] left-[76px] right-0 z-30 pointer-events-none opacity-40">
          <FlagStripe hairline={true} />
        </div>

        {/* Column 1: Left Sidebar */}
        <Sidebar width={sidebarWidth} onResizeStart={handleResizeStart} />

        {/* Column 2: Main Area */}
        <main
          aria-label="K.O.S Workspace"
          className="relative flex-1 flex flex-col h-full bg-[#0B0E0C] overflow-hidden"
        >
          {/* Background: Kurdish radial glow + rotating 21-ray sun watermark */}
          <Watermark />

          {/* Top-Right Floating Controls (Compress button + K.O.S Studio pill) */}
          <TopBar />

          {/* Dynamic Content Views */}
          {activeTask ? (
            /* Task Execution View when a task is running or selected */
            <TaskExecutionView
              task={activeTask}
              onBack={() => resetToNewChat()}
            />
          ) : currentRoute !== 'new-chat' ? (
            /* Sub-views (Library, Images, Scheduled, etc.) */
            <RouteView
              route={currentRoute}
              onBack={() => resetToNewChat()}
            />
          ) : (
            /* Default Home View: Hero Headline + Centered Composer + Mode Switch */
            <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-8 z-10 w-full max-w-[1500px] mx-auto">
              {/* Hero Headline: centered horizontally at ~38% viewport height */}
              <div className="w-full text-center mb-8 sm:mb-12 select-none">
                <h1
                  className="
                    text-[#F5F4EF] font-light tracking-[-0.03em] leading-tight
                    text-[36px] sm:text-[48px] md:text-[56px] xl:text-[64px]
                  "
                >
                  You bring the idea, I'll take action
                </h1>
              </div>

              {/* Composer Card: centered, min(1420px, 85% of main), radius 40px */}
              <div className="w-full max-w-[1420px] flex justify-center">
                <Composer
                  onOpenFolderPicker={() => setFolderPickerOpen(true)}
                  onOpenAttachMenu={() => setAttachMenuOpen(true)}
                />
              </div>

              {/* Mode switch below the composer: [ Chat | Task ] */}
              <div className="mt-7 flex justify-center">
                <ModeSwitch />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      <SearchModal />
      <FolderPickerModal />
      <KosStudioModal />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}
