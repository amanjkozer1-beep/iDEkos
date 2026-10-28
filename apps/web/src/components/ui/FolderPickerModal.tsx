import React from 'react';
import { Folder, Check, X, HardDrive } from 'lucide-react';
import { useAppStore } from '../../store';

const availableFolders = [
  { id: 'agent-workspace', name: 'agent-workspace', path: '~/kos/agent-workspace', count: '14 files' },
  { id: 'src-components', name: 'src/components', path: '~/kos/src/components', count: '8 files' },
  { id: 'autonomous-pipeline', name: 'autonomous-pipeline', path: '~/kos/pipeline', count: '22 files' },
  { id: 'tests-e2e', name: 'tests/e2e', path: '~/kos/tests', count: '5 suites' },
];

export const FolderPickerModal: React.FC = () => {
  const { folderPickerOpen, setFolderPickerOpen, selectedFolder, setSelectedFolder } =
    useAppStore();

  if (!folderPickerOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select workspace folder"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100"
    >
      <div className="w-full max-w-md glass-popover rounded-3xl overflow-hidden shadow-2xl border border-white/10 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-[#FED100]" />
            <h2 className="text-base font-medium text-white">Files & Folders</h2>
          </div>
          <button
            onClick={() => setFolderPickerOpen(false)}
            aria-label="Close folder picker"
            className="p-1 rounded-lg text-[#8F968F] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#8F968F]">
          Choose the active repository directory or workspace context for agent execution.
        </p>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {availableFolders.map((f) => {
            const isSelected = selectedFolder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                className={`
                  flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer border
                  ${
                    isSelected
                      ? 'bg-black/60 border-[#FED100]/60 text-white shadow-inner'
                      : 'bg-white/[0.03] border-white/5 text-[#C8CEC9] hover:bg-white/[0.08] hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Folder
                    className={`w-5 h-5 ${
                      isSelected ? 'text-[#FED100]' : 'text-[#8F968F]'
                    }`}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{f.name}</span>
                    <span className="text-[11px] text-[#8F968F] font-mono">
                      {f.path}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8F968F]">{f.count}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#FED100]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={() => setFolderPickerOpen(false)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
