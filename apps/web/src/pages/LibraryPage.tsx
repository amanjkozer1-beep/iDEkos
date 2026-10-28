import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Plus,
  Trash2,
  Search,
  Copy,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useAppStore } from '../store';
import { SunMark } from '../components/ui/SunMark';
import { Button } from '../components/ui/Button';

export const LibraryPage: React.FC = () => {
  const {
    libraryItems,
    fetchLibrary,
    addLibraryItem,
    deleteLibraryItem,
    setCurrentRoute,
  } = useAppStore();

  const [libSearch, setLibSearch] = useState('');
  const [showAddLib, setShowAddLib] = useState(false);
  const [newLibTitle, setNewLibTitle] = useState('');
  const [newLibCategory, setNewLibCategory] = useState('');
  const [newLibContent, setNewLibContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const filtered = libraryItems.filter(
    (item) =>
      item.title.toLowerCase().includes(libSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(libSearch.toLowerCase())
  );

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

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

        <button
          onClick={() => setShowAddLib(!showAddLib)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#278E43]/20 hover:bg-[#278E43]/30 text-[#28C840] border border-[#278E43]/40 text-xs font-medium cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Snippet</span>
        </button>
      </div>

      {/* Header */}
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

      {/* Add Snippet Form */}
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
                    onClick={() => handleCopy(item.id, item.content)}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-[#28C840]" />
                        <span className="text-[#28C840]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
