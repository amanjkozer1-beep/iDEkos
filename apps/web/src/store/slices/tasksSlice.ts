import { StateCreator } from 'zustand';
import { api } from '../../services/api';
import { wsService } from '../../services/ws';

export type AppMode = 'task' | 'chat';

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

export interface TasksSlice {
  mode: AppMode;
  activeTaskId: string | null;
  tasks: TaskItem[];
  composerText: string;
  setMode: (mode: AppMode) => void;
  setActiveTaskId: (id: string | null) => void;
  setComposerText: (text: string) => void;
  fetchTasks: () => Promise<void>;
  createNewTask: (prompt: string, mode: AppMode) => Promise<TaskItem>;
  approveStep: (taskId: string, stepId: string) => Promise<void>;
  denyStep: (taskId: string, stepId: string) => Promise<void>;
  resetToNewChat: () => void;
}

export const createTasksSlice: StateCreator<any, [], [], TasksSlice> = (set, get) => ({
  mode: 'task',
  activeTaskId: null,
  tasks: [],
  composerText: '',

  setMode: (mode) => set({ mode }),
  setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
  setComposerText: (composerText) => set({ composerText }),

  resetToNewChat: () =>
    set({
      activeTaskId: null,
      composerText: '',
      currentRoute: 'new-chat',
      morePopoverOpen: false,
    }),

  fetchTasks: async () => {
    try {
      const tasks = await api.agent.getTasks();
      set({ tasks });
    } catch {
      // Keep state
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

    set((state: any) => ({
      tasks: [initialPlaceholder, ...state.tasks],
      activeTaskId: initialPlaceholder.id,
      composerText: '',
      currentRoute: 'new-chat',
    }));

    try {
      const serverTask = await api.agent.createTask(prompt, mode);
      set((state: any) => ({
        tasks: state.tasks.map((t: TaskItem) => (t.id === fallbackId ? serverTask : t)),
        activeTaskId: serverTask.id,
      }));

      wsService.subscribeToTask(serverTask.id, (updatedTask: TaskItem) => {
        set((state: any) => ({
          tasks: state.tasks.map((t: TaskItem) => (t.id === updatedTask.id ? updatedTask : t)),
        }));
      });

      return serverTask;
    } catch (err) {
      console.warn('Backend connection issue:', err);
      return initialPlaceholder;
    }
  },

  approveStep: async (taskId: string, stepId: string) => {
    set((state: any) => ({
      tasks: state.tasks.map((t: TaskItem) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) => (s.id === stepId ? { ...s, status: 'completed' as const } : s)),
        };
      }),
    }));

    try {
      await api.agent.approveStep(taskId, stepId, true);
    } catch {}
  },

  denyStep: async (taskId: string, stepId: string) => {
    set((state: any) => ({
      tasks: state.tasks.map((t: TaskItem) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) => (s.id === stepId ? { ...s, status: 'failed' as const } : s)),
        };
      }),
    }));

    try {
      await api.agent.approveStep(taskId, stepId, false);
    } catch {}
  },
});
