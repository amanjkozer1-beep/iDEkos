import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Folder, FileText, ArrowRight, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SearchModal: React.FC = () => {
  const {
    searchOpen,
    setSearchOpen,
    tasks,
    setActiveTaskId,
    setStudioOpen,
    setCurrentRoute,
  } = useAppStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search and command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100"
    >
      <div className="w-full max-w-xl glass-popover rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-[#8F968F]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, actions..."
            autoFocus
            className="flex-1 bg-transparent border-none text-white text-lg placeholder-[#7F867F] outline-none"
          />
          <button
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className="p-1 rounded-lg text-[#8F968F] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-3 flex flex-col gap-1">
          <div className="text-[11px] font-semibold uppercase text-[#8F968F] px-3 py-1">
            Quick Actions
          </div>

          <button
            onClick={() => {
              setStudioOpen(true);
              setSearchOpen(false);
            }}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-sm text-white group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#FED100]" />
              <span>Launch K.O.S Studio Workspace</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => {
              setCurrentRoute('new-chat');
              setSearchOpen(false);
            }}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-sm text-white group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#28C840]" />
              <span>Create New Task or Chat (⌘N)</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="text-[11px] font-semibold uppercase text-[#8F968F] px-3 py-1 mt-2">
            Tasks & Projects
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#8F968F]">
              No matches for "{query}"
            </div>
          ) : (
            filteredTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTaskId(t.id);
                  setSearchOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-sm text-white group cursor-pointer"
              >
                <div className="flex items-center gap-3 truncate">
                  <Folder className="w-4 h-4 text-[#FED100]" />
                  <span className="truncate">{t.title}</span>
                </div>
                <span className="text-xs text-[#8F968F]">{t.createdAt}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
