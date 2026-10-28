import { useAppStore } from '../store';

export function useTasks() {
  const tasks = useAppStore((s) => s.tasks);
  const activeTaskId = useAppStore((s) => s.activeTaskId);
  const fetchTasks = useAppStore((s) => s.fetchTasks);
  const createNewTask = useAppStore((s) => s.createNewTask);
  const resetToNewChat = useAppStore((s) => s.resetToNewChat);
  const setActiveTaskId = useAppStore((s) => s.setActiveTaskId);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return {
    tasks,
    activeTaskId,
    activeTask,
    fetchTasks,
    createNewTask,
    resetToNewChat,
    setActiveTaskId,
  };
}
