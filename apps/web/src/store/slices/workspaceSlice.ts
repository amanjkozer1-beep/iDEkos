import { StateCreator } from 'zustand';
import { api } from '../../services/api';

export interface WorkspaceFileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: WorkspaceFileNode[];
}

export interface DiagnosticProblem {
  file: string;
  line: number;
  col: number;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface WorkspaceSlice {
  workspaceTree: WorkspaceFileNode | null;
  selectedStudioFile: string;
  selectedFileContent: string;
  terminalLogs: string[];
  diagnosticsStatus: { success: boolean; problemsCount: number; problems: DiagnosticProblem[]; output: string } | null;
  unsavedFiles: Record<string, string>;
  gitStatusFiles: Array<{ status: string; file: string }>;

  fetchWorkspaceTree: () => Promise<void>;
  selectStudioFile: (filePath: string) => Promise<void>;
  updateFileContent: (filePath: string, content: string) => void;
  saveStudioFile: (filePath?: string) => Promise<boolean>;
  createWorkspaceItem: (path: string, isDirectory: boolean) => Promise<boolean>;
  deleteWorkspaceItem: (path: string) => Promise<boolean>;
  searchWorkspace: (query: string) => Promise<Array<{ file: string; line: number; content: string }>>;
  fetchGitStatus: () => Promise<void>;
  runTerminalCommand: (command: string) => Promise<{ stdout: string; stderr: string }>;
  runDiagnosticsCheck: () => Promise<void>;
}

export const createWorkspaceSlice: StateCreator<any, [], [], WorkspaceSlice> = (set, get) => ({
  workspaceTree: null,
  selectedStudioFile: 'apps/web/src/App.tsx',
  selectedFileContent: '// Select a file from the explorer...',
  terminalLogs: [
    '$ kos-kernel --version',
    'K.O.S Autonomous Agent Kernel v2.4 (Clean Architecture Online)',
    'Ready for instructions_',
  ],
  diagnosticsStatus: null,
  unsavedFiles: {},
  gitStatusFiles: [],

  fetchWorkspaceTree: async () => {
    try {
      const tree = await api.workspace.getTree();
      set({ workspaceTree: tree });
    } catch {}
  },

  selectStudioFile: async (filePath: string) => {
    set({ selectedStudioFile: filePath });
    const unsaved = get().unsavedFiles[filePath];
    if (unsaved !== undefined) {
      set({ selectedFileContent: unsaved });
      return;
    }
    try {
      const data = await api.workspace.readFile(filePath);
      set({ selectedFileContent: data.content });
    } catch {
      set({ selectedFileContent: '// Could not read file content' });
    }
  },

  updateFileContent: (filePath: string, content: string) => {
    set((state: any) => ({
      unsavedFiles: { ...state.unsavedFiles, [filePath]: content },
      selectedFileContent: state.selectedStudioFile === filePath ? content : state.selectedFileContent,
    }));
  },

  saveStudioFile: async (filePath?: string) => {
    const targetPath = filePath || get().selectedStudioFile;
    const content = get().unsavedFiles[targetPath] ?? get().selectedFileContent;
    try {
      const res = await api.workspace.writeFile(targetPath, content);
      if (res.success) {
        set((state: any) => {
          const nextUnsaved = { ...state.unsavedFiles };
          delete nextUnsaved[targetPath];
          return {
            unsavedFiles: nextUnsaved,
            terminalLogs: [
              ...state.terminalLogs,
              `✓ Saved ${targetPath} successfully (${new Date().toLocaleTimeString()})`,
            ],
          };
        });
        return true;
      }
      return false;
    } catch (err: any) {
      set((state: any) => ({
        terminalLogs: [...state.terminalLogs, `✗ Error saving ${targetPath}: ${err.message}`],
      }));
      return false;
    }
  },

  createWorkspaceItem: async (targetPath: string, isDirectory: boolean) => {
    try {
      const res = await api.workspace.createPath(targetPath, isDirectory);
      if (res.success) {
        await get().fetchWorkspaceTree();
        if (!isDirectory) {
          await get().selectStudioFile(targetPath);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  deleteWorkspaceItem: async (targetPath: string) => {
    try {
      const res = await api.workspace.deletePath(targetPath);
      if (res.success) {
        await get().fetchWorkspaceTree();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  searchWorkspace: async (query: string) => {
    if (!query.trim()) return [];
    try {
      return await api.workspace.search(query.trim());
    } catch {
      return [];
    }
  },

  fetchGitStatus: async () => {
    try {
      const data = await api.workspace.getGitStatus();
      set({ gitStatusFiles: data.files || [] });
    } catch {
      set({ gitStatusFiles: [] });
    }
  },

  runTerminalCommand: async (command: string) => {
    const currentLogs = get().terminalLogs;
    set({ terminalLogs: [...currentLogs, `$ ${command}`] });

    try {
      const data = await api.workspace.runTerminal(command);
      const output = data.stdout || data.stderr || 'Command executed with 0 output.';
      set((state: any) => ({
        terminalLogs: [...state.terminalLogs, output],
      }));
      return data;
    } catch (err: any) {
      const errorMsg = `Error: ${err.message}`;
      set((state: any) => ({
        terminalLogs: [...state.terminalLogs, errorMsg],
      }));
      return { stdout: '', stderr: errorMsg, exitCode: 1 };
    }
  },

  runDiagnosticsCheck: async () => {
    try {
      const diag = await api.workspace.getDiagnostics();
      set({ diagnosticsStatus: diag });
    } catch {
      set({
        diagnosticsStatus: {
          success: false,
          problemsCount: 1,
          problems: [
            {
              file: 'workspace',
              line: 1,
              col: 1,
              severity: 'error',
              code: 'ERR_DIAGNOSTICS_FAILED',
              message: 'Failed to run diagnostics check against workspace.',
            },
          ],
          output: 'Diagnostics check failed',
        },
      });
    }
  },
});
