/**
 * API Service for K.O.S Frontend
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Agent Endpoints
  agent: {
    createTask: (prompt: string, mode: 'task' | 'chat' = 'task') =>
      request<any>('/api/agent/task', {
        method: 'POST',
        body: JSON.stringify({ prompt, mode }),
      }),

    getTasks: () => request<any[]>('/api/agent/tasks'),

    getTask: (id: string) => request<any>(`/api/agent/tasks/${id}`),

    approveStep: (taskId: string, stepId: string, approved: boolean) =>
      request<{ success: boolean }>('/api/agent/approve', {
        method: 'POST',
        body: JSON.stringify({ taskId, stepId, approved }),
      }),
  },

  // Workspace Endpoints
  workspace: {
    getTree: () => request<any>('/api/workspace/tree'),

    readFile: (path: string, start?: number, end?: number) => {
      const params = new URLSearchParams({ path });
      if (start) params.set('start', String(start));
      if (end) params.set('end', String(end));
      return request<any>(`/api/workspace/file?${params.toString()}`);
    },

    writeFile: (path: string, content: string) =>
      request<{ success: boolean; path: string }>('/api/workspace/file', {
        method: 'POST',
        body: JSON.stringify({ path, content }),
      }),

    search: (query: string, isRegex = false, limit = 50) => {
      const params = new URLSearchParams({
        q: query,
        regex: String(isRegex),
        limit: String(limit),
      });
      return request<any[]>(`/api/workspace/search?${params.toString()}`);
    },

    runTerminal: (command: string) =>
      request<{ stdout: string; stderr: string; exitCode: number }>('/api/workspace/terminal', {
        method: 'POST',
        body: JSON.stringify({ command }),
      }),

    createPath: (path: string, isDirectory: boolean, content?: string) =>
      request<{ success: boolean; path: string }>('/api/workspace/create', {
        method: 'POST',
        body: JSON.stringify({ path, isDirectory, content }),
      }),

    deletePath: (path: string) =>
      request<{ success: boolean; path: string }>('/api/workspace/delete', {
        method: 'POST',
        body: JSON.stringify({ path }),
      }),

    getGitStatus: () => request<{ files: Array<{ status: string; file: string }> }>('/api/workspace/git-status'),

    getDiagnostics: () => request<any>('/api/workspace/diagnostics'),
  },

  // Storage Endpoints
  storage: {
    getLibrary: () => request<any[]>('/api/library'),
    addLibrary: (item: { title: string; category: string; content: string }) =>
      request<any>('/api/library', { method: 'POST', body: JSON.stringify(item) }),
    deleteLibrary: (id: string) =>
      request<{ success: boolean }>(`/api/library/${id}`, { method: 'DELETE' }),

    getScheduled: () => request<any[]>('/api/scheduled'),
    addScheduled: (item: { title: string; cron_schedule: string; command: string }) =>
      request<any>('/api/scheduled', { method: 'POST', body: JSON.stringify(item) }),
    updateScheduled: (id: string, patch: any) =>
      request<{ success: boolean }>(`/api/scheduled/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    deleteScheduled: (id: string) =>
      request<{ success: boolean }>(`/api/scheduled/${id}`, { method: 'DELETE' }),
    runScheduled: (id: string) =>
      request<any>(`/api/scheduled/${id}/run`, { method: 'POST' }),

    getImages: () => request<any[]>('/api/images'),
    addImage: (item: { name: string; data_url: string; size_kb: number }) =>
      request<any>('/api/images', { method: 'POST', body: JSON.stringify(item) }),
    deleteImage: (id: string) =>
      request<{ success: boolean }>(`/api/images/${id}`, { method: 'DELETE' }),

    getDailyBrief: () => request<any>('/api/daily-brief'),
  },

  // System Endpoints
  system: {
    getHealth: () => request<any>('/api/health'),
    getSettings: () => request<any>('/api/system/settings'),
    updateSettings: (settings: any) =>
      request<any>('/api/system/settings', { method: 'POST', body: JSON.stringify(settings) }),
  },
};
