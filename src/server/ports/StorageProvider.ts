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
  getTasks(): StoredTask[];
  getTask(id: string): StoredTask | null;
  upsertTask(task: StoredTask): void;

  // Steps
  getSteps(taskId: string): StoredStep[];
  upsertStep(step: StoredStep): void;

  // Artifacts
  getArtifacts(taskId: string): StoredArtifact[];
  addArtifact(artifact: StoredArtifact): void;
  deleteArtifact(id: string): void;
  getAllArtifacts(): StoredArtifact[];

  // Logs
  addLog(taskId: string, message: string): void;
  getLogs(taskId: string): string[];

  // Library
  getLibraryItems(): StoredLibraryItem[];
  addLibraryItem(item: StoredLibraryItem): void;
  deleteLibraryItem(id: string): void;

  // Scheduled
  getScheduledTasks(): StoredScheduledTask[];
  addScheduledTask(task: StoredScheduledTask): void;
  updateScheduledTask(id: string, patch: Partial<StoredScheduledTask>): void;
  deleteScheduledTask(id: string): void;

  // Images
  getImages(): StoredImageItem[];
  addImage(image: StoredImageItem): void;
  deleteImage(id: string): void;

  // Daily Brief
  getDailyBrief(): DailyBriefSummary;
}
