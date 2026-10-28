import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { useSSE } from './hooks/useSSE';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { NewChatPage } from './pages/NewChatPage';
import { TaskExecutionPage } from './pages/TaskExecutionPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { KosStudioModal } from './components/editor/KosStudioModal';
import { SearchModal } from './components/ui/SearchModal';
import { FolderPickerModal } from './components/ui/FolderPickerModal';

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
              Restart Desktop Session
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const {
    currentRoute,
    setCurrentRoute,
    activeTaskId,
    setActiveTaskId,
    toggleSidebar,
    searchOpen,
    setSearchOpen,
    isWindowExpanded,
  } = useAppStore();

  const [sidebarWidth, setSidebarWidth] = useState(310);
  const [isResizing, setIsResizing] = useState(false);

  // Connect Server-Sent Events stream for autonomous live updates
  useSSE();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveTaskId(null);
        setCurrentRoute('new-chat');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, searchOpen, setSearchOpen, setActiveTaskId, setCurrentRoute]);

  // Sidebar drag resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      setSidebarWidth(Math.min(Math.max(e.clientX, 280), 440));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Determine which page to render in center area
  const renderPage = () => {
    if (activeTaskId) {
      return <TaskExecutionPage />;
    }

    switch (currentRoute) {
      case 'new-chat':
        return <NewChatPage />;
      case 'library':
        return <LibraryPage />;
      case 'customize':
        return <SettingsPage />;
      case 'scheduled':
      case 'images':
      case 'daily-brief':
      case 'videos':
        // Reuse SettingsPage or LibraryPage or respective route views
        return <SettingsPage />;
      default:
        return <NewChatPage />;
    }
  };

  return (
    <AppErrorBoundary>
      <div className="w-screen h-screen overflow-hidden flex bg-[#000000] text-[#F5F4EF] font-sans">
        {/* Left Column: Fixed Navigation Sidebar */}
        <Sidebar
          width={sidebarWidth}
          onResizeStart={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />

        {/* Right Column: Main Content Canvas */}
        <main className="relative flex-1 flex flex-col h-full overflow-hidden bg-[#000000]">
          {/* Top Bar Floating Pill Controls */}
          <TopBar />

          {/* Active View Container */}
          <div className="relative flex-1 flex flex-col h-full overflow-hidden">
            {renderPage()}
          </div>
        </main>

        {/* Global Modals & Dialogs */}
        <SearchModal />
        <FolderPickerModal />
        <KosStudioModal />
      </div>
    </AppErrorBoundary>
  );
};

export default App;
