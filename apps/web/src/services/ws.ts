/**
 * Real-time SSE Stream & WebSocket service abstraction for K.O.S
 */

export class StreamService {
  private eventSource: EventSource | null = null;

  public subscribeToTask(
    taskId: string,
    onMessage: (data: any) => void,
    onError?: (error: any) => void
  ): () => void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`/api/agent/stream/${taskId}`);

    this.eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    };

    this.eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  public close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const wsService = new StreamService();
