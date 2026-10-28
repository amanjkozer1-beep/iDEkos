import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Trash2,
  FilePlus,
  FolderPlus,
  RefreshCw,
  X,
  GitBranch,
} from 'lucide-react';
import { WorkspaceFileNode } from '../../store';

interface FileTreeProps {
  tree: WorkspaceFileNode | null;
  selectedFile: string;
  unsavedFiles: Record<string, boolean>;
  gitStatusFiles: Array<{ file: string; status: string }>;
  onSelectFile: (path: string) => void;
  onCreateItem: (path: string, isDirectory: boolean) => Promise<boolean>;
  onDeleteItem: (path: string) => Promise<void>;
  onRefresh: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  tree,
  selectedFile,
  unsavedFiles,
  gitStatusFiles,
  onSelectFile,
  onCreateItem,
  onDeleteItem,
  onRefresh,
}) => {
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleCreate = async (e: React.FormEvent, isDir: boolean) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const ok = await onCreateItem(newItemName.trim(), isDir);
    if (ok) {
      setNewItemName('');
      setShowNewFileInput(false);
      setShowNewFolderInput(false);
    }
  };

  const renderNode = (node: WorkspaceFileNode) => {
    if (node.isDirectory) {
      return (
        <div key={node.path} className="flex flex-col">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-white/80 hover:bg-white/5 font-medium select-none text-xs">
            <Folder className="w-3.5 h-3.5 text-[#FED100]" />
            <span className="truncate">{node.name}</span>
          </div>
          <div className="pl-3.5 border-l border-white/5 ml-2 flex flex-col gap-0.5">
            {node.children?.map((child) => renderNode(child))}
          </div>
        </div>
      );
    }

    const isSelected = selectedFile === node.path;
    const isDirty = !!unsavedFiles[node.path];

    return (
      <div
        key={node.path}
        className={`group flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-[#222A25] text-white font-medium shadow-xs'
            : 'text-[#A5ABA5] hover:bg-white/5 hover:text-white'
        }`}
        onClick={() => onSelectFile(node.path)}
      >
        <div className="flex items-center gap-2 truncate">
          <FileCode
            className={`w-3.5 h-3.5 shrink-0 ${
              isSelected ? 'text-[#FED100]' : 'text-[#8F968F]'
            }`}
          />
          <span className="truncate text-xs">{node.name}</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-[#FED100]" title="Unsaved changes" />}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete ${node.name}?`)) {
              onDeleteItem(node.path);
            }
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#FF5F57] text-[#8F968F] transition-opacity cursor-pointer"
          title={`Delete ${node.name}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-64 bg-[#0E1310] border-r border-white/5 flex flex-col shrink-0 h-full">
      <div className="px-3 py-2.5 text-xs tracking-wider text-[#8F968F] font-semibold flex items-center justify-between border-b border-white/5 select-none">
        <span className="uppercase text-[11px]">Workspace</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowNewFileInput(true);
              setShowNewFolderInput(false);
            }}
            className="p-1 rounded hover:bg-white/10 text-[#A5ABA5] hover:text-white cursor-pointer"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#FED100]" />
          </button>
          <button
            onClick={() => {
              setShowNewFolderInput(true);
              setShowNewFileInput(false);
            }}
            className="p-1 rounded hover:bg-white/10 text-[#A5ABA5] hover:text-white cursor-pointer"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#28C840]" />
          </button>
          <button
            onClick={onRefresh}
            className="p-1 rounded hover:bg-white/10 text-[#A5ABA5] hover:text-white cursor-pointer"
            title="Refresh File Tree"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {(showNewFileInput || showNewFolderInput) && (
        <form
          onSubmit={(e) => handleCreate(e, showNewFolderInput)}
          className="p-2 border-b border-white/10 bg-[#141A16] flex flex-col gap-1.5 text-xs"
        >
          <div className="text-[11px] text-[#FED100] font-medium">
            {showNewFolderInput ? 'New Folder Path:' : 'New File Path:'}
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={showNewFolderInput ? 'src/components/new' : 'src/components/MyComponent.tsx'}
              className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-[#FED100]"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-1 bg-[#278E43] hover:bg-[#28C840] text-black font-semibold rounded text-xs cursor-pointer"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewFileInput(false);
                setShowNewFolderInput(false);
                setNewItemName('');
              }}
              className="px-1.5 py-1 text-[#8F968F] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 px-2 py-2 overflow-y-auto text-xs sidebar-scrollbar">
        {tree ? (
          renderNode(tree)
        ) : (
          <div className="p-3 text-xs text-[#8F968F] flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading workspace tree...</span>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-white/5 bg-[#090C0A] text-[11px] flex items-center justify-between text-[#8F968F] select-none">
        <div className="flex items-center gap-1.5 font-mono">
          <GitBranch className="w-3.5 h-3.5 text-[#FED100]" />
          <span>main</span>
        </div>
        <span>{gitStatusFiles.length} changed files</span>
      </div>
    </div>
  );
};
