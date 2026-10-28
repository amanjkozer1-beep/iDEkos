import { useEffect } from 'react';
import { wsService } from '../../services/ws';

export function useSSE(taskId: string | null, onMessage: (data: any) => void) {
  useEffect(() => {
    if (!taskId) return;

    const unsubscribe = wsService.subscribeToTask(taskId, onMessage);
    return () => {
      unsubscribe();
    };
  }, [taskId, onMessage]);
}
