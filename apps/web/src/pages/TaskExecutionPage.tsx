import React from 'react';
import { useAppStore } from '../store';
import { TaskExecutionView } from '../components/agent/TaskExecutionView';
import { SunMark } from '../components/ui/SunMark';
import { Button } from '../components/ui/Button';

export const TaskExecutionPage: React.FC = () => {
  const { tasks, activeTaskId, setActiveTaskId, resetToNewChat } = useAppStore();

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  if (!activeTask) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <SunMark variant="small" size={32} />
        <h2 className="text-xl font-light text-white mt-4">No Active Task Selected</h2>
        <p className="text-sm text-[#8F968F] mt-2 mb-6">
          Select an existing project from the sidebar or start a new task in the workspace.
        </p>
        <Button onClick={resetToNewChat} variant="primary">
          Create New Task
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col">
      <TaskExecutionView task={activeTask} onBack={resetToNewChat} />
    </div>
  );
};
