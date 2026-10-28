import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { SqliteStorageAdapter } from '../src/server/adapters/SqliteStorageAdapter';

describe('SqliteStorageAdapter Persistence Suite', () => {
  const testDbPath = path.resolve(process.cwd(), 'test-kos.sqlite');
  let storage: SqliteStorageAdapter;

  before(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    storage = new SqliteStorageAdapter(testDbPath);
  });

  after(() => {
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    }
  });

  it('initializes tables and seeds default items', () => {
    const lib = storage.getLibraryItems();
    assert.ok(lib.length >= 3, 'Expected seeded library items');

    const sched = storage.getScheduledTasks();
    assert.ok(sched.length >= 3, 'Expected seeded scheduled tasks');

    const images = storage.getImages();
    assert.ok(images.length >= 2, 'Expected seeded images');
  });

  it('performs CRUD operations on tasks and steps', () => {
    const taskId = 'task-test-1';
    storage.upsertTask({
      id: taskId,
      title: 'Test Agent Task',
      prompt: 'Execute verification',
      mode: 'task',
      status: 'planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const fetched = storage.getTask(taskId);
    assert.ok(fetched);
    assert.strictEqual(fetched.title, 'Test Agent Task');

    storage.upsertStep({
      id: 'step-1',
      task_id: taskId,
      title: 'Inspect AST',
      status: 'completed',
      timestamp: '12:00:00',
      requires_approval: 0,
    });

    const steps = storage.getSteps(taskId);
    assert.strictEqual(steps.length, 1);
    assert.strictEqual(steps[0].title, 'Inspect AST');
  });

  it('performs CRUD operations on Library items', () => {
    const newItem = {
      id: 'lib-custom-1',
      title: 'Custom AST Snippet',
      category: 'Compiler',
      content: 'console.log("AST");',
      created_at: new Date().toISOString(),
    };
    storage.addLibraryItem(newItem);

    const items = storage.getLibraryItems();
    const found = items.find((i: any) => i.id === 'lib-custom-1');
    assert.ok(found);
    assert.strictEqual(found.title, 'Custom AST Snippet');

    storage.deleteLibraryItem('lib-custom-1');
    const afterDelete = storage.getLibraryItems();
    assert.strictEqual(afterDelete.some((i: any) => i.id === 'lib-custom-1'), false);
  });

  it('performs CRUD and updates on Scheduled tasks', () => {
    const newTask = {
      id: 'sched-custom-1',
      title: 'Custom Sweep',
      cron_schedule: '0 0 * * *',
      command: 'git status',
      enabled: 1,
      last_run: 'Never',
      last_status: 'Pending',
    };
    storage.addScheduledTask(newTask);

    storage.updateScheduledTask('sched-custom-1', {
      last_status: 'Passed',
      last_run: 'Just now',
    });

    const tasks = storage.getScheduledTasks();
    const found = tasks.find((t: any) => t.id === 'sched-custom-1');
    assert.ok(found);
    assert.strictEqual(found.last_status, 'Passed');

    storage.deleteScheduledTask('sched-custom-1');
    assert.strictEqual(storage.getScheduledTasks().some((t: any) => t.id === 'sched-custom-1'), false);
  });

  it('computes dynamic daily brief summary accurately', () => {
    const brief = storage.getDailyBrief();
    assert.ok(brief.date.length > 0);
    assert.ok(typeof brief.tasksCompleted === 'number');
    assert.ok(typeof brief.tasksFailed === 'number');
    assert.ok(typeof brief.totalSteps === 'number');
    assert.ok(Array.isArray(brief.recentHeadlines));
    assert.ok(brief.systemHealth.length > 0);
  });
});
