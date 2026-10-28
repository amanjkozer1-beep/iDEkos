export interface StoredTask {
  id: string;
  title: string;
  prompt: string;
  mode: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StoredStep {
  id: string;
  task_id: string;
  title: string;
  status: string;
  timestamp: string;
  command?: string;
  details?: string;
  diff_summary?: string;
  diff_text?: string;
  requires_approval: number;
}

export interface StoredArtifact {
  id: string;
  task_id: string;
  title: string;
  type: string;
  preview: string;
  size?: string;
}

export interface StoredLibraryItem {
  id: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
}

export interface StoredScheduledTask {
  id: string;
  title: string;
  cron_schedule: string;
  command: string;
  enabled: number;
  last_run?: string;
  last_status?: string;
}

export interface StoredImageItem {
  id: string;
  name: string;
  data_url: string;
  created_at: string;
  size_kb: number;
}

export interface DailyBriefSummary {
  date: string;
  tasksCompleted: number;
  tasksFailed: number;
  totalSteps: number;
  recentHeadlines: string[];
  systemHealth: string;
}

export interface StorageProvider {
  // Tasks
  upsertTask(task: StoredTask): void;
  getTasks(): StoredTask[];
  getTask(id: string): StoredTask | null;

  // Steps
  upsertStep(step: StoredStep): void;
  getSteps(taskId: string): StoredStep[];

  // Artifacts
  addArtifact(artifact: StoredArtifact): void;
  getArtifacts(taskId: string): StoredArtifact[];

  // Logs
  addLog(taskId: string, message: string): void;
  getLogs(taskId: string): string[];

  // Library
  getLibraryItems(): StoredLibraryItem[];
  addLibraryItem(item: StoredLibraryItem): void;
  deleteLibraryItem(id: string): void;

  // Scheduled Tasks
  getScheduledTasks(): StoredScheduledTask[];
  addScheduledTask(task: StoredScheduledTask): void;
  updateScheduledTask(id: string, updates: Partial<StoredScheduledTask>): void;
  deleteScheduledTask(id: string): void;

  // Images
  getImages(): StoredImageItem[];
  addImage(item: StoredImageItem): void;
  deleteImage(id: string): void;

  // Daily Brief
  getDailyBrief(): DailyBriefSummary;
}
