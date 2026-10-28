import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import {
  StorageProvider,
  StoredTask,
  StoredStep,
  StoredArtifact,
  StoredLibraryItem,
  StoredScheduledTask,
  StoredImageItem,
  DailyBriefSummary,
} from '../ports/StorageProvider';

export class SqliteStorageAdapter implements StorageProvider {
  private db: DatabaseSync;

  constructor(dbPath?: string) {
    const finalPath = dbPath || path.resolve(process.cwd(), 'kos-workspace.sqlite');
    this.db = new DatabaseSync(finalPath);
    this.initTables();
    this.seedDefaultsIfEmpty();
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

      CREATE TABLE IF NOT EXISTS library_items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cron_schedule TEXT NOT NULL,
        command TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        last_run TEXT,
        last_status TEXT
      );

      CREATE TABLE IF NOT EXISTS image_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data_url TEXT NOT NULL,
        created_at TEXT NOT NULL,
        size_kb REAL NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_steps_task_id ON steps(task_id);
      CREATE INDEX IF NOT EXISTS idx_steps_status ON steps(status);
      CREATE INDEX IF NOT EXISTS idx_artifacts_task_id ON artifacts(task_id);
      CREATE INDEX IF NOT EXISTS idx_logs_task_id ON logs(task_id);
      CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items(category);
      CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled ON scheduled_tasks(enabled);
    `);
  }

  private seedDefaultsIfEmpty() {
    // Seed Library if empty
    const libCountStmt = this.db.prepare(`SELECT count(*) as count FROM library_items`);
    const libCount = (libCountStmt.get() as any)?.count || 0;
    if (libCount === 0) {
      const now = new Date().toISOString();
      const insertLib = this.db.prepare(`
        INSERT INTO library_items (id, title, category, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertLib.run('lib-1', 'TypeScript AST Transformer', 'AST / Compiler', 'export function transformAst(node: any) {\n  // Autonomous node visitor\n  return node;\n}', now);
      insertLib.run('lib-2', 'React 19 Clean Component Scaffold', 'Frontend', 'import React from "react";\nexport const CleanComponent: React.FC = () => {\n  return <div>K.O.S Clean Component</div>;\n};', now);
      insertLib.run('lib-3', 'Deterministic Agent Verification Test Harness', 'Quality / QA', 'import { describe, it } from "node:test";\nimport assert from "node:assert";\ndescribe("Sandbox Suite", () => {\n  it("verifies clean isolation", () => { assert.strictEqual(1, 1); });\n});', now);
    }

    // Seed Scheduled tasks if empty
    const schedCountStmt = this.db.prepare(`SELECT count(*) as count FROM scheduled_tasks`);
    const schedCount = (schedCountStmt.get() as any)?.count || 0;
    if (schedCount === 0) {
      const insertSched = this.db.prepare(`
        INSERT INTO scheduled_tasks (id, title, cron_schedule, command, enabled, last_run, last_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertSched.run('sched-1', 'Codebase Typecheck & Diagnostics', '0 */6 * * *', 'npm run build', 1, 'Never', 'Pending');
      insertSched.run('sched-2', 'Dependency Integrity Sweep', '0 0 * * *', 'npm audit --json', 1, 'Yesterday', 'Passing');
      insertSched.run('sched-3', 'Git Working Tree Cleanliness Check', '*/30 * * * *', 'git status', 1, '10 min ago', 'Clean');
    }

    // Seed Images if empty
    const imgCountStmt = this.db.prepare(`SELECT count(*) as count FROM image_items`);
    const imgCount = (imgCountStmt.get() as any)?.count || 0;
    if (imgCount === 0) {
      const now = new Date().toISOString();
      const insertImg = this.db.prepare(`
        INSERT INTO image_items (id, name, data_url, created_at, size_kb)
        VALUES (?, ?, ?, ?, ?)
      `);
      const sunSvgUri = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="16" fill="%23FED100"/><circle cx="50" cy="50" r="12" fill="%23ED2024"/></svg>';
      insertImg.run('img-1', 'kurdish-21-ray-golden-sun.svg', sunSvgUri, now, 1.4);
      insertImg.run('img-2', 'kos-window-mesh-glow.png', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAErgHzk653cwAAAABJRU5ErkJggg==', now, 2.8);
    }
  }

  // --- Tasks ---
  public getTasks(): StoredTask[] {
    const stmt = this.db.prepare(`SELECT * FROM tasks ORDER BY created_at DESC`);
    return stmt.all() as unknown as StoredTask[];
  }

  public getTask(id: string): StoredTask | null {
    const stmt = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`);
    const row = stmt.get(id);
    return row ? (row as unknown as StoredTask) : null;
  }

  public upsertTask(task: StoredTask): void {
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

  // --- Steps ---
  public getSteps(taskId: string): StoredStep[] {
    const stmt = this.db.prepare(`SELECT * FROM steps WHERE task_id = ? ORDER BY rowid ASC`);
    return stmt.all(taskId) as unknown as StoredStep[];
  }

  public upsertStep(step: StoredStep): void {
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

  // --- Artifacts ---
  public getArtifacts(taskId: string): StoredArtifact[] {
    const stmt = this.db.prepare(`SELECT * FROM artifacts WHERE task_id = ?`);
    return stmt.all(taskId) as unknown as StoredArtifact[];
  }

  public getAllArtifacts(): StoredArtifact[] {
    const stmt = this.db.prepare(`SELECT * FROM artifacts ORDER BY rowid DESC`);
    return stmt.all() as unknown as StoredArtifact[];
  }

  public addArtifact(artifact: StoredArtifact): void {
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

  public deleteArtifact(id: string): void {
    const stmt = this.db.prepare(`DELETE FROM artifacts WHERE id = ?`);
    stmt.run(id);
  }

  // --- Logs ---
  public addLog(taskId: string, message: string): void {
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

  // --- Library ---
  public getLibraryItems(): StoredLibraryItem[] {
    const stmt = this.db.prepare(`SELECT * FROM library_items ORDER BY created_at DESC`);
    return stmt.all() as unknown as StoredLibraryItem[];
  }

  public addLibraryItem(item: StoredLibraryItem): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO library_items (id, title, category, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(item.id, item.title, item.category, item.content, item.created_at);
  }

  public deleteLibraryItem(id: string): void {
    const stmt = this.db.prepare(`DELETE FROM library_items WHERE id = ?`);
    stmt.run(id);
  }

  // --- Scheduled ---
  public getScheduledTasks(): StoredScheduledTask[] {
    const stmt = this.db.prepare(`SELECT * FROM scheduled_tasks ORDER BY rowid ASC`);
    return stmt.all() as unknown as StoredScheduledTask[];
  }

  public addScheduledTask(task: StoredScheduledTask): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO scheduled_tasks (id, title, cron_schedule, command, enabled, last_run, last_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      task.id,
      task.title,
      task.cron_schedule,
      task.command,
      task.enabled ? 1 : 0,
      task.last_run || 'Never',
      task.last_status || 'Pending'
    );
  }

  public updateScheduledTask(id: string, patch: Partial<StoredScheduledTask>): void {
    const currentStmt = this.db.prepare(`SELECT * FROM scheduled_tasks WHERE id = ?`);
    const current = currentStmt.get(id) as any;
    if (!current) return;

    const merged = {
      title: patch.title !== undefined ? patch.title : current.title,
      cron_schedule: patch.cron_schedule !== undefined ? patch.cron_schedule : current.cron_schedule,
      command: patch.command !== undefined ? patch.command : current.command,
      enabled: patch.enabled !== undefined ? (patch.enabled ? 1 : 0) : current.enabled,
      last_run: patch.last_run !== undefined ? patch.last_run : current.last_run,
      last_status: patch.last_status !== undefined ? patch.last_status : current.last_status,
    };

    const updateStmt = this.db.prepare(`
      UPDATE scheduled_tasks
      SET title = ?, cron_schedule = ?, command = ?, enabled = ?, last_run = ?, last_status = ?
      WHERE id = ?
    `);
    updateStmt.run(
      merged.title,
      merged.cron_schedule,
      merged.command,
      merged.enabled,
      merged.last_run,
      merged.last_status,
      id
    );
  }

  public deleteScheduledTask(id: string): void {
    const stmt = this.db.prepare(`DELETE FROM scheduled_tasks WHERE id = ?`);
    stmt.run(id);
  }

  // --- Images ---
  public getImages(): StoredImageItem[] {
    const stmt = this.db.prepare(`SELECT * FROM image_items ORDER BY created_at DESC`);
    return stmt.all() as unknown as StoredImageItem[];
  }

  public addImage(image: StoredImageItem): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO image_items (id, name, data_url, created_at, size_kb)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(image.id, image.name, image.data_url, image.created_at, image.size_kb);
  }

  public deleteImage(id: string): void {
    const stmt = this.db.prepare(`DELETE FROM image_items WHERE id = ?`);
    stmt.run(id);
  }

  // --- Daily Brief ---
  public getDailyBrief(): DailyBriefSummary {
    const completedTasksStmt = this.db.prepare(`SELECT count(*) as count FROM tasks WHERE status = 'completed'`);
    const failedTasksStmt = this.db.prepare(`SELECT count(*) as count FROM tasks WHERE status = 'failed'`);
    const totalStepsStmt = this.db.prepare(`SELECT count(*) as count FROM steps`);

    const completed = (completedTasksStmt.get() as any)?.count || 0;
    const failed = (failedTasksStmt.get() as any)?.count || 0;
    const totalSteps = (totalStepsStmt.get() as any)?.count || 0;

    const recentTasksStmt = this.db.prepare(`SELECT title FROM tasks ORDER BY created_at DESC LIMIT 4`);
    const recentRows = recentTasksStmt.all() as unknown as { title: string }[];
    const headlines = recentRows.map((r) => r.title);

    if (headlines.length === 0) {
      headlines.push('Workspace initialized with zero defects.');
      headlines.push('Hexagonal Ports & Adapters architecture active.');
    }

    return {
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      tasksCompleted: completed,
      tasksFailed: failed,
      totalSteps,
      recentHeadlines: headlines,
      systemHealth: failed === 0 ? 'Optimal (100% healthy)' : `${failed} failed task(s) logged`,
    };
  }
}
