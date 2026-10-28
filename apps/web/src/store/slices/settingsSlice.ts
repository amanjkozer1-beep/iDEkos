import { StateCreator } from 'zustand';
import { api } from '../../services/api';

export type NavRoute =
  | 'new-chat'
  | 'library'
  | 'images'
  | 'scheduled'
  | 'daily-brief'
  | 'customize'
  | 'videos';

export interface SystemSettings {
  autonomyLevel: 'full_auto' | 'human_approval' | 'read_only';
  model: string;
  maxTokens: number;
  contextCaching: boolean;
  theme: string;
  fontScale: string;
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

export interface SettingsSlice {
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
  filterQuery: string;
  projectsCollapsed: boolean;
  settings: SystemSettings;

  libraryItems: LibraryItem[];
  scheduledTasks: ScheduledTask[];
  images: ImageItem[];
  dailyBrief: DailyBriefData | null;
  isFetchingData: boolean;

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
  setFilterQuery: (query: string) => void;
  toggleProjectsCollapsed: () => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;

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
    if (stored !== null) return stored === 'true';
    return window.innerWidth < 1100;
  }
  return false;
};

export const createSettingsSlice: StateCreator<any, [], [], SettingsSlice> = (set, get) => ({
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
  filterQuery: '',
  projectsCollapsed: true,

  settings: {
    autonomyLevel: 'human_approval',
    model: 'gemini-3.5-flash-lite',
    maxTokens: 1048576,
    contextCaching: true,
    theme: 'deep_dark',
    fontScale: '100%',
  },

  libraryItems: [],
  scheduledTasks: [],
  images: [],
  dailyBrief: null,
  isFetchingData: false,

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
    set((s: any) => {
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

  toggleWindowExpanded: () => set((s: any) => ({ isWindowExpanded: !s.isWindowExpanded })),
  toggleMic: () => set((s: any) => ({ isMicActive: !s.isMicActive })),
  toggleScreenShare: () => set((s: any) => ({ isScreenSharing: !s.isScreenSharing })),
  setFolderPickerOpen: (folderPickerOpen) => set({ folderPickerOpen }),
  setSelectedFolder: (selectedFolder) => set({ selectedFolder, folderPickerOpen: false }),
  setAttachMenuOpen: (attachMenuOpen) => set({ attachMenuOpen }),
  setFilterQuery: (filterQuery) => set({ filterQuery }),
  toggleProjectsCollapsed: () => set((s: any) => ({ projectsCollapsed: !s.projectsCollapsed })),

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    try {
      await api.system.updateSettings(updated);
    } catch {}
  },

  fetchLibrary: async () => {
    try {
      const items = await api.storage.getLibrary();
      set({ libraryItems: items });
    } catch {}
  },

  addLibraryItem: async (title, category, content) => {
    try {
      const newItem = await api.storage.addLibrary({ title, category, content });
      set((s: any) => ({ libraryItems: [newItem, ...s.libraryItems] }));
    } catch {}
  },

  deleteLibraryItem: async (id) => {
    try {
      await api.storage.deleteLibrary(id);
      set((s: any) => ({ libraryItems: s.libraryItems.filter((i: any) => i.id !== id) }));
    } catch {}
  },

  fetchScheduled: async () => {
    try {
      const tasks = await api.storage.getScheduled();
      set({ scheduledTasks: tasks });
    } catch {}
  },

  addScheduledTask: async (title, cron_schedule, command) => {
    try {
      const newTask = await api.storage.addScheduled({ title, cron_schedule, command });
      set((s: any) => ({ scheduledTasks: [...s.scheduledTasks, newTask] }));
    } catch {}
  },

  toggleScheduledTask: async (id, enabled) => {
    try {
      await api.storage.updateScheduled(id, { enabled: enabled ? 1 : 0 });
      set((s: any) => ({
        scheduledTasks: s.scheduledTasks.map((t: any) =>
          t.id === id ? { ...t, enabled: enabled ? 1 : 0 } : t
        ),
      }));
    } catch {}
  },

  deleteScheduledTask: async (id) => {
    try {
      await api.storage.deleteScheduled(id);
      set((s: any) => ({ scheduledTasks: s.scheduledTasks.filter((t: any) => t.id !== id) }));
    } catch {}
  },

  runScheduledTaskNow: async (id) => {
    try {
      await api.storage.runScheduled(id);
      get().fetchScheduled();
    } catch {}
  },

  fetchImages: async () => {
    try {
      const images = await api.storage.getImages();
      set({ images });
    } catch {}
  },

  addImageItem: async (name, data_url, size_kb = 1.0) => {
    try {
      const newImg = await api.storage.addImage({ name, data_url, size_kb });
      set((s: any) => ({ images: [newImg, ...s.images] }));
    } catch {}
  },

  deleteImageItem: async (id) => {
    try {
      await api.storage.deleteImage(id);
      set((s: any) => ({ images: s.images.filter((img: any) => img.id !== id) }));
    } catch {}
  },

  fetchDailyBrief: async () => {
    try {
      const brief = await api.storage.getDailyBrief();
      set({ dailyBrief: brief });
    } catch {}
  },
});
