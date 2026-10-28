import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

export interface DbTask {
  id: string;
  title: string;
  prompt: string;
  mode: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbStep {
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

export interface DbArtifact {
  id: string;
  task_id: string;
  title: string;
  type: string;
  preview: string;
  size?: string;
}

export interface DbLog {
  id?: number;
  task_id: string;
  message: string;
  timestamp: string;
}

class DatabaseManager {
  private db: DatabaseSync;

  constructor() {
    const dbPath = path.resolve(process.cwd(), 'kos-workspace.sqlite');
    this.db = new DatabaseSync(dbPath);
    this.initTables();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS steps (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        command TEXT,
        details TEXT,
        diff_summary TEXT,
        diff_text TEXT,
        requires_approval INTEGER DEFAULT 0,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        preview TEXT NOT NULL,
        size TEXT,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
    `);
  }

  public upsertTask(task: DbTask) {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, title, prompt, mode, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        status = excluded.status,
        updated_at = excluded.updated_at
    `);
    stmt.run(
      task.id,
      task.title,
      task.prompt,
      task.mode,
      task.status,
      task.created_at,
      task.updated_at
    );
  }

  public getTasks(): DbTask[] {
    const stmt = this.db.prepare(`SELECT * FROM tasks ORDER BY created_at DESC`);
    return stmt.all() as unknown as DbTask[];
  }

  public getTask(id: string): DbTask | null {
    const stmt = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`);
    const res = stmt.get(id);
    return res ? (res as unknown as DbTask) : null;
  }

  public upsertStep(step: DbStep) {
    const stmt = this.db.prepare(`
      INSERT INTO steps (id, task_id, title, status, timestamp, command, details, diff_summary, diff_text, requires_approval)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        status = excluded.status,
        timestamp = excluded.timestamp,
        command = excluded.command,
        details = excluded.details,
        diff_summary = excluded.diff_summary,
        diff_text = excluded.diff_text,
        requires_approval = excluded.requires_approval
    `);
    stmt.run(
      step.id,
      step.task_id,
      step.title,
      step.status,
      step.timestamp,
      step.command || null,
      step.details || null,
      step.diff_summary || null,
      step.diff_text || null,
      step.requires_approval ? 1 : 0
    );
  }

  public getSteps(taskId: string): DbStep[] {
    const stmt = this.db.prepare(`SELECT * FROM steps WHERE task_id = ? ORDER BY rowid ASC`);
    return stmt.all(taskId) as unknown as DbStep[];
  }

  public addArtifact(artifact: DbArtifact) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO artifacts (id, task_id, title, type, preview, size)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      artifact.id,
      artifact.task_id,
      artifact.title,
      artifact.type,
      artifact.preview,
      artifact.size || null
    );
  }

  public getArtifacts(taskId: string): DbArtifact[] {
    const stmt = this.db.prepare(`SELECT * FROM artifacts WHERE task_id = ?`);
    return stmt.all(taskId) as unknown as DbArtifact[];
  }

  public addLog(taskId: string, message: string) {
    const stmt = this.db.prepare(`
      INSERT INTO logs (task_id, message, timestamp)
      VALUES (?, ?, ?)
    `);
    stmt.run(taskId, message, new Date().toISOString());
  }

  public getLogs(taskId: string): string[] {
    const stmt = this.db.prepare(`SELECT message FROM logs WHERE task_id = ? ORDER BY id ASC`);
    const rows = stmt.all(taskId) as unknown as { message: string }[];
    return rows.map((r) => r.message);
  }
}

export const db = new DatabaseManager();
