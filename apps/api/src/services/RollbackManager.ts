import crypto from 'crypto';
import { WorkspaceProvider } from '../ports/WorkspaceProvider';

export interface FileSnapshot {
  path: string;
  content: string;
  hash: string;
  timestamp: number;
}

export interface TaskSnapshot {
  taskId: string;
  files: Map<string, FileSnapshot>;
  createdAt: number;
}

export class RollbackManager {
  private snapshots: Map<string, TaskSnapshot> = new Map();
  private workspace: WorkspaceProvider;

  constructor(workspace: WorkspaceProvider) {
    this.workspace = workspace;
  }

  private computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Captures a file snapshot before modification
   */
  public async snapshotFile(taskId: string, filePath: string): Promise<FileSnapshot> {
    let taskSnap = this.snapshots.get(taskId);
    if (!taskSnap) {
      taskSnap = {
        taskId,
        files: new Map(),
        createdAt: Date.now(),
      };
      this.snapshots.set(taskId, taskSnap);
    }

    if (taskSnap.files.has(filePath)) {
      return taskSnap.files.get(filePath)!;
    }

    let content = '';
    try {
      const readRes = await this.workspace.readFile(filePath);
      content = readRes.content;
    } catch {
      content = '';
    }

    const snapshot: FileSnapshot = {
      path: filePath,
      content,
      hash: this.computeHash(content),
      timestamp: Date.now(),
    };

    taskSnap.files.set(filePath, snapshot);
    return snapshot;
  }

  /**
   * Restores a single file to its baseline snapshot
   */
  public async rollbackFile(taskId: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    const taskSnap = this.snapshots.get(taskId);
    if (!taskSnap || !taskSnap.files.has(filePath)) {
      return { success: false, error: `No baseline snapshot found for "${filePath}".` };
    }

    const snap = taskSnap.files.get(filePath)!;
    try {
      await this.workspace.writeFile(filePath, snap.content);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Restores all modified files in a task back to baseline
   */
  public async rollbackAllTaskFiles(taskId: string): Promise<{ restored: string[]; errors: string[] }> {
    const taskSnap = this.snapshots.get(taskId);
    if (!taskSnap) {
      return { restored: [], errors: [] };
    }

    const restored: string[] = [];
    const errors: string[] = [];

    for (const [filePath, snap] of taskSnap.files.entries()) {
      try {
        await this.workspace.writeFile(filePath, snap.content);
        restored.push(filePath);
      } catch (err: any) {
        errors.push(`${filePath}: ${err.message}`);
      }
    }

    return { restored, errors };
  }

  public getSnapshottedFiles(taskId: string): string[] {
    const taskSnap = this.snapshots.get(taskId);
    if (!taskSnap) return [];
    return Array.from(taskSnap.files.keys());
  }

  public cleanupTaskSnapshots(taskId: string): void {
    this.snapshots.delete(taskId);
  }
}
