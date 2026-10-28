import { create } from 'zustand';
import { createTasksSlice, TasksSlice } from './slices/tasksSlice';
import { createWorkspaceSlice, WorkspaceSlice } from './slices/workspaceSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';
import { loggerMiddleware } from './middleware';

export type RootStore = TasksSlice & WorkspaceSlice & SettingsSlice;

export const useAppStore = create<RootStore>(
  loggerMiddleware((...a) => ({
    ...createTasksSlice(...a),
    ...createWorkspaceSlice(...a),
    ...createSettingsSlice(...a),
  }))
);

export * from './slices/tasksSlice';
export * from './slices/workspaceSlice';
export * from './slices/settingsSlice';
