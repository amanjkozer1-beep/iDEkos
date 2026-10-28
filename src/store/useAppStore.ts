import { create } from 'zustand';

export type AppMode = 'task' | 'chat';
export type NavRoute =
  | 'new-chat'
  | 'library'
  | 'images'
  | 'scheduled'
  | 'daily-brief'
  | 'customize'
  | 'videos';

export interface TaskStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  timestamp: string;
  command?: string;
  details?: string;
  diffSummary?: string;
  diffText?: string;
  requiresApproval?: boolean;
}

export interface TaskArtifact {
  id: string;
  title: string;
  type: 'code' | 'diff' | 'terminal' | 'file';
  preview: string;
  size?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  prompt: string;
  mode: AppMode;
  createdAt: string;
  status: 'planning' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'idle';
  steps: TaskStep[];
  artifacts: TaskArtifact[];
  logs?: string[];
}

export interface SystemSettings {
  autonomyLevel: 'full_auto' | 'human_approval' | 'read_only';
  model: string;
  maxTokens: number;
  contextCaching: boolean;
  theme: string;
  fontScale: string;
}

export interface WorkspaceFileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: WorkspaceFileNode[];
}

export interface LibraryItem {
  id: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
}

export interface ScheduledTask {
  id: string;
  title: string;
  cron_schedule: string;
  command: string;
  enabled: number;
  last_run?: string;
  last_status?: string;
}

export interface ImageItem {
  id: string;
  name: string;
  data_url: string;
  created_at: string;
  size_kb: number;
}

export interface DailyBriefData {
  date: string;
  tasksCompleted: number;
  tasksFailed: number;
  totalSteps: number;
  recentHeadlines: string[];
  systemHealth: string;
}

export interface DiagnosticProblem {
  file: string;
  line: number;
  col: number;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface AppState {
  mode: AppMode;
  currentRoute: NavRoute;
  sidebarCollapsed: boolean;
  morePopoverOpen: boolean;
  accountMenuOpen: boolean;
  searchOpen: boolean;
  studioOpen: boolean;
  isWindowExpanded: boolean;
  isMicActive: boolean;
  isScreenSharing: boolean;
  folderPickerOpen: boolean;
  attachMenuOpen: boolean;
  selectedFolder: string;
  composerText: string;
  filterQuery: string;
  projectsCollapsed: boolean;
  activeTaskId: string | null;
  tasks: TaskItem[];
  settings: SystemSettings;
  workspaceTree: WorkspaceFileNode | null;
  selectedStudioFile: string;
  selectedFileContent: string;
  terminalLogs: string[];
  diagnosticsStatus: { success: boolean; problemsCount: number; problems: DiagnosticProblem[]; output: string } | null;
  unsavedFiles: Record<string, string>;
  gitStatusFiles: Array<{ status: string; file: string }>;

  // SQLite data
  libraryItems: LibraryItem[];
  scheduledTasks: ScheduledTask[];
  images: ImageItem[];
  dailyBrief: DailyBriefData | null;
  isFetchingData: boolean;

  // Actions
  setMode: (mode: AppMode) => void;
  setCurrentRoute: (route: NavRoute) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMorePopoverOpen: (open: boolean) => void;
  setAccountMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setStudioOpen: (open: boolean) => void;
  toggleWindowExpanded: () => void;
  toggleMic: () => void;
  toggleScreenShare: () => void;
  setFolderPickerOpen: (open: boolean) => void;
  setSelectedFolder: (folder: string) => void;
  setAttachMenuOpen: (open: boolean) => void;
  setComposerText: (text: string) => void;
  setFilterQuery: (query: string) => void;
  toggleProjectsCollapsed: () => void;
  setActiveTaskId: (id: string | null) => void;
  resetToNewChat: () => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;

  // Backend Integration Methods
  fetchTasks: () => Promise<void>;
  createNewTask: (prompt: string, mode: AppMode) => Promise<TaskItem>;
  approveStep: (taskId: string, stepId: string) => Promise<void>;
  denyStep: (taskId: string, stepId: string) => Promise<void>;
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

  // Real SQLite CRUD Actions
  fetchLibrary: () => Promise<void>;
  addLibraryItem: (title: string, category: string, content: string) => Promise<void>;
  deleteLibraryItem: (id: string) => Promise<void>;

  fetchScheduled: () => Promise<void>;
  addScheduledTask: (title: string, cron_schedule: string, command: string) => Promise<void>;
  toggleScheduledTask: (id: string, enabled: boolean) => Promise<void>;
  deleteScheduledTask: (id: string) => Promise<void>;
  runScheduledTaskNow: (id: string) => Promise<void>;

  fetchImages: () => Promise<void>;
  addImageItem: (name: string, data_url: string, size_kb?: number) => Promise<void>;
  deleteImageItem: (id: string) => Promise<void>;

  fetchDailyBrief: () => Promise<void>;
}

const getInitialSidebarCollapsed = (): boolean => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('kos_sidebar_collapsed');
    if (stored !== null) {
      return stored === 'true';
    }
    return window.innerWidth < 1100;
  }
  return false;
};

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'task',
  currentRoute: 'new-chat',
  sidebarCollapsed: getInitialSidebarCollapsed(),
  morePopoverOpen: false,
  accountMenuOpen: false,
  searchOpen: false,
  studioOpen: false,
  isWindowExpanded: false,
  isMicActive: false,
  isScreenSharing: false,
  folderPickerOpen: false,
  attachMenuOpen: false,
  selectedFolder: 'agent-workspace',
  composerText: '',
  filterQuery: '',
  projectsCollapsed: true,
  activeTaskId: null,
  tasks: [],
  settings: {
    autonomyLevel: 'human_approval',
    model: 'standard-v1',
    maxTokens: 1048576,
    contextCaching: true,
    theme: 'deep_dark',
    fontScale: '100%',
  },
  workspaceTree: null,
  selectedStudioFile: 'src/App.tsx',
  selectedFileContent: '// Select a file from the explorer...',
  terminalLogs: [
    '$ kos-kernel --version',
    'K.O.S Autonomous Agent Kernel v2.4 (Model Kernel Online)',
    'Ready for instructions_',
  ],
  diagnosticsStatus: null,
  unsavedFiles: {},
  gitStatusFiles: [],

  libraryItems: [],
  scheduledTasks: [],
  images: [],
  dailyBrief: null,
  isFetchingData: false,

  setMode: (mode) => set({ mode }),
  setCurrentRoute: (currentRoute) => {
    set({ currentRoute, morePopoverOpen: false });
    if (currentRoute === 'new-chat') {
      set({ activeTaskId: null, composerText: '' });
    } else if (currentRoute === 'library') {
      get().fetchLibrary();
    } else if (currentRoute === 'scheduled') {
      get().fetchScheduled();
    } else if (currentRoute === 'images') {
      get().fetchImages();
    } else if (currentRoute === 'daily-brief') {
      get().fetchDailyBrief();
    }
  },
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kos_sidebar_collapsed', String(next));
      }
      return { sidebarCollapsed: next };
    }),
  setSidebarCollapsed: (sidebarCollapsed) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kos_sidebar_collapsed', String(sidebarCollapsed));
    }
    set({ sidebarCollapsed });
  },
  setMorePopoverOpen: (morePopoverOpen) => set({ morePopoverOpen }),
  setAccountMenuOpen: (accountMenuOpen) => set({ accountMenuOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setStudioOpen: (studioOpen) => {
    set({ studioOpen });
    if (studioOpen) {
      get().fetchWorkspaceTree();
      get().selectStudioFile(get().selectedStudioFile);
    }
  },
  toggleWindowExpanded: () =>
    set((s) => ({ isWindowExpanded: !s.isWindowExpanded })),
  toggleMic: () => set((s) => ({ isMicActive: !s.isMicActive })),
  toggleScreenShare: () =>
    set((s) => ({ isScreenSharing: !s.isScreenSharing })),
  setFolderPickerOpen: (folderPickerOpen) => set({ folderPickerOpen }),
  setSelectedFolder: (selectedFolder) =>
    set({ selectedFolder, folderPickerOpen: false }),
  setAttachMenuOpen: (attachMenuOpen) => set({ attachMenuOpen }),
  setComposerText: (composerText) => set({ composerText }),
  setFilterQuery: (filterQuery) => set({ filterQuery }),
  toggleProjectsCollapsed: () =>
    set((s) => ({ projectsCollapsed: !s.projectsCollapsed })),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
  resetToNewChat: () =>
    set({
      activeTaskId: null,
      composerText: '',
      currentRoute: 'new-chat',
      morePopoverOpen: false,
    }),

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    try {
      await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // offline fallback
    }
  },

  fetchTasks: async () => {
    try {
      const res = await fetch('/api/agent/tasks');
      if (res.ok) {
        const tasks = await res.json();
        set({ tasks });
      }
    } catch {
      // Keep existing
    }
  },

  createNewTask: async (prompt: string, mode: AppMode) => {
    const fallbackId = `task-${Date.now()}`;
    const initialPlaceholder: TaskItem = {
      id: fallbackId,
      title: prompt.length > 40 ? `${prompt.substring(0, 40)}...` : prompt,
      prompt,
      mode,
      createdAt: 'Just now',
      status: 'planning',
      steps: [
        {
          id: `step-${Date.now()}-plan`,
          title: 'Analyze intent & build Task Dependency Graph',
          status: 'running',
          timestamp: 'Just now',
          details: 'Communicating with K.O.S Orchestrator backend...',
        },
      ],
      artifacts: [],
    };

    set((state) => ({
      tasks: [initialPlaceholder, ...state.tasks],
      activeTaskId: initialPlaceholder.id,
      composerText: '',
      currentRoute: 'new-chat',
    }));

    try {
      const res = await fetch('/api/agent/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
      });

      if (res.ok) {
        const serverTask: TaskItem = await res.json();
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === fallbackId ? serverTask : t)),
          activeTaskId: serverTask.id,
        }));

        const eventSource = new EventSource(`/api/agent/stream/${serverTask.id}`);
        eventSource.onmessage = (event) => {
          try {
            const updatedTask: TaskItem = JSON.parse(event.data);
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === updatedTask.id ? updatedTask : t
              ),
            }));

            if (
              updatedTask.status === 'completed' ||
              updatedTask.status === 'failed'
            ) {
              eventSource.close();
            }
          } catch {
            // Ignore parse errors
          }
        };

        return serverTask;
      }
    } catch (err) {
      console.warn('Backend offline or disconnected:', err);
    }

    return initialPlaceholder;
  },

  approveStep: async (taskId: string, stepId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) =>
            s.id === stepId ? { ...s, status: 'completed' } : s
          ),
        };
      }),
    }));

    try {
      await fetch('/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, stepId, approved: true }),
      });
    } catch {
      // Handled optimistically
    }
  },

  denyStep: async (taskId: string, stepId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) =>
            s.id === stepId ? { ...s, status: 'failed' } : s
          ),
        };
      }),
    }));

    try {
      await fetch('/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, stepId, approved: false }),
      });
    } catch {
      // Handled optimistically
    }
  },

  fetchWorkspaceTree: async () => {
    try {
      const res = await fetch('/api/workspace/tree');
      if (res.ok) {
        const tree = await res.json();
        set({ workspaceTree: tree });
      }
    } catch {
      // Fallback
    }
  },

  selectStudioFile: async (filePath: string) => {
    set({ selectedStudioFile: filePath });
    const unsaved = get().unsavedFiles[filePath];
    if (unsaved !== undefined) {
      set({ selectedFileContent: unsaved });
      return;
    }
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        set({ selectedFileContent: data.content });
      } else {
        set({ selectedFileContent: '// Could not read file content' });
      }
    } catch {
      set({ selectedFileContent: '// Could not read file content' });
    }
  },

  updateFileContent: (filePath: string, content: string) => {
    set((state) => ({
      unsavedFiles: { ...state.unsavedFiles, [filePath]: content },
      selectedFileContent: state.selectedStudioFile === filePath ? content : state.selectedFileContent,
    }));
  },

  saveStudioFile: async (filePath?: string) => {
    const targetPath = filePath || get().selectedStudioFile;
    const content = get().unsavedFiles[targetPath] ?? get().selectedFileContent;
    try {
      const res = await fetch('/api/workspace/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath, content }),
      });
      if (res.ok) {
        set((state) => {
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
      set((state) => ({
        terminalLogs: [...state.terminalLogs, `✗ Error saving ${targetPath}: ${err.message}`],
      }));
      return false;
    }
  },

  createWorkspaceItem: async (targetPath: string, isDirectory: boolean) => {
    try {
      const res = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath, isDirectory }),
      });
      if (res.ok) {
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
      const res = await fetch('/api/workspace/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath }),
      });
      if (res.ok) {
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
      const res = await fetch(`/api/workspace/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch {
      return [];
    }
  },

  fetchGitStatus: async () => {
    try {
      const res = await fetch('/api/workspace/git-status');
      if (res.ok) {
        const data = await res.json();
        set({ gitStatusFiles: data.files || [] });
      }
    } catch {
      set({ gitStatusFiles: [] });
    }
  },

  runTerminalCommand: async (command: string) => {
    const currentLogs = get().terminalLogs;
    set({ terminalLogs: [...currentLogs, `$ ${command}`] });

    try {
      const res = await fetch('/api/workspace/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      const output = data.stdout || data.stderr || 'Command executed with 0 output.';
      set((state) => ({
        terminalLogs: [...state.terminalLogs, output],
      }));
      return data;
    } catch (err: any) {
      const errorMsg = `Error: ${err.message}`;
      set((state) => ({
        terminalLogs: [...state.terminalLogs, errorMsg],
      }));
      return { stdout: '', stderr: errorMsg };
    }
  },

  runDiagnosticsCheck: async () => {
    try {
      const res = await fetch('/api/workspace/diagnostics');
      if (res.ok) {
        const diag = await res.json();
        set({ diagnosticsStatus: diag });
      }
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

  // SQLite Persistence implementations
  fetchLibrary: async () => {
    try {
      const res = await fetch('/api/library');
      if (res.ok) {
        const items = await res.json();
        set({ libraryItems: items });
      }
    } catch {}
  },

  addLibraryItem: async (title, category, content) => {
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, content }),
      });
      if (res.ok) {
        const newItem = await res.json();
        set((s) => ({ libraryItems: [newItem, ...s.libraryItems] }));
      }
    } catch {}
  },

  deleteLibraryItem: async (id) => {
    try {
      await fetch(`/api/library/${id}`, { method: 'DELETE' });
      set((s) => ({ libraryItems: s.libraryItems.filter((i) => i.id !== id) }));
    } catch {}
  },

  fetchScheduled: async () => {
    try {
      const res = await fetch('/api/scheduled');
      if (res.ok) {
        const tasks = await res.json();
        set({ scheduledTasks: tasks });
      }
    } catch {}
  },

  addScheduledTask: async (title, cron_schedule, command) => {
    try {
      const res = await fetch('/api/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cron_schedule, command }),
      });
      if (res.ok) {
        const newTask = await res.json();
        set((s) => ({ scheduledTasks: [...s.scheduledTasks, newTask] }));
      }
    } catch {}
  },

  toggleScheduledTask: async (id, enabled) => {
    try {
      await fetch(`/api/scheduled/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: enabled ? 1 : 0 }),
      });
      set((s) => ({
        scheduledTasks: s.scheduledTasks.map((t) =>
          t.id === id ? { ...t, enabled: enabled ? 1 : 0 } : t
        ),
      }));
    } catch {}
  },

  deleteScheduledTask: async (id) => {
    try {
      await fetch(`/api/scheduled/${id}`, { method: 'DELETE' });
      set((s) => ({ scheduledTasks: s.scheduledTasks.filter((t) => t.id !== id) }));
    } catch {}
  },

  runScheduledTaskNow: async (id) => {
    try {
      const res = await fetch(`/api/scheduled/${id}/run`, { method: 'POST' });
      if (res.ok) {
        get().fetchScheduled();
      }
    } catch {}
  },

  fetchImages: async () => {
    try {
      const res = await fetch('/api/images');
      if (res.ok) {
        const images = await res.json();
        set({ images });
      }
    } catch {}
  },

  addImageItem: async (name, data_url, size_kb = 1.0) => {
    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data_url, size_kb }),
      });
      if (res.ok) {
        const newImg = await res.json();
        set((s) => ({ images: [newImg, ...s.images] }));
      }
    } catch {}
  },

  deleteImageItem: async (id) => {
    try {
      await fetch(`/api/images/${id}`, { method: 'DELETE' });
      set((s) => ({ images: s.images.filter((img) => img.id !== id) }));
    } catch {}
  },

  fetchDailyBrief: async () => {
    try {
      const res = await fetch('/api/daily-brief');
      if (res.ok) {
        const brief = await res.json();
        set({ dailyBrief: brief });
      }
    } catch {}
  },
}));
