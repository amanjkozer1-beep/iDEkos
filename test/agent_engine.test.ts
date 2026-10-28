import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { ContextManager } from '../src/server/context/ContextManager';
import { TaskDependencyGraph } from '../src/server/agent/TaskDependencyGraph';
import { RollbackManager } from '../src/server/agent/RollbackManager';
import { SelfCorrectionEngine } from '../src/server/agent/SelfCorrectionEngine';
import { LocalWorkspaceAdapter } from '../src/server/adapters/LocalWorkspaceAdapter';
import { HardenedShellAdapter } from '../src/server/adapters/HardenedShellAdapter';

describe('Phase 1 Critical Engines Test Suite', () => {
  const testRoot = process.cwd();
  const workspace = new LocalWorkspaceAdapter(testRoot);
  const shell = new HardenedShellAdapter(testRoot);

  describe('ContextManager', () => {
    const cm = new ContextManager(100, 20); // Small budget for testing truncation

    it('accurately estimates character-based tokens', () => {
      const text = 'Hello world, this is a test prompt.';
      const tokens = cm.estimateTokens(text);
      assert.ok(tokens > 5 && tokens < 20);
    });

    it('compacts history when exceeding token budget while keeping objective', () => {
      const history = [
        { role: 'user', parts: [{ text: 'Main task objective' }] },
        { role: 'model', parts: [{ text: 'Long response 1 '.repeat(10) }] },
        { role: 'user', parts: [{ text: 'Long response 2 '.repeat(10) }] },
        { role: 'model', parts: [{ text: 'Recent response' }] },
      ];

      const truncated = cm.truncateHistory(history, 'New prompt');
      assert.strictEqual(truncated[0].parts[0].text, 'Main task objective');
      assert.ok(truncated.length <= history.length);
    });

    it('records cumulative token usage and estimates costs', () => {
      const usage = cm.recordUsage('Input prompt text', 'Output generated text');
      assert.ok(usage.promptTokens > 0);
      assert.ok(usage.completionTokens > 0);
      assert.ok(usage.totalTokens > 0);
    });
  });

  describe('TaskDependencyGraph (DAG)', () => {
    it('detects cycles accurately', () => {
      const graph = new TaskDependencyGraph();
      graph.addTask('task-A', {}, ['task-B']);
      graph.addTask('task-B', {}, ['task-A']);

      assert.strictEqual(graph.detectCycles(), true, 'Expected cycle between A and B');
    });

    it('identifies executable tasks in dependency order', () => {
      const graph = new TaskDependencyGraph();
      graph.addTask('build', {}, []);
      graph.addTask('test', {}, ['build']);
      graph.addTask('deploy', {}, ['test']);

      assert.strictEqual(graph.detectCycles(), false);

      // Initially only 'build' should be executable
      let exec = graph.getExecutableTasks();
      assert.strictEqual(exec.length, 1);
      assert.strictEqual(exec[0].id, 'build');

      // Complete 'build'
      graph.markStatus('build', 'completed');
      exec = graph.getExecutableTasks();
      assert.strictEqual(exec.length, 1);
      assert.strictEqual(exec[0].id, 'test');

      // Complete 'test'
      graph.markStatus('test', 'completed');
      exec = graph.getExecutableTasks();
      assert.strictEqual(exec.length, 1);
      assert.strictEqual(exec[0].id, 'deploy');
    });

    it('computes topological order for non-cyclic graphs', () => {
      const graph = new TaskDependencyGraph();
      graph.addTask('step-1', {}, []);
      graph.addTask('step-2', {}, ['step-1']);
      graph.addTask('step-3', {}, ['step-2']);

      const order = graph.getTopologicalOrder();
      assert.ok(order.indexOf('step-1') < order.indexOf('step-2'));
      assert.ok(order.indexOf('step-2') < order.indexOf('step-3'));
    });
  });

  describe('RollbackManager', () => {
    const testFile = 'test-rollback-target.txt';
    const originalText = 'Initial original baseline content';

    before(async () => {
      await workspace.writeFile(testFile, originalText);
    });

    after(() => {
      const p = path.resolve(testRoot, testFile);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    it('snapshots file baseline and rolls back modifications', async () => {
      const rm = new RollbackManager(workspace);
      const taskId = 'task-rollback-suite-1';

      // 1. Take snapshot of baseline
      await rm.snapshotFile(taskId, testFile);

      // 2. Modify file
      await workspace.writeFile(testFile, 'Corrupted or erroneous text content');
      let current = await workspace.readFile(testFile);
      assert.strictEqual(current.content, 'Corrupted or erroneous text content');

      // 3. Rollback file
      const rollRes = await rm.rollbackFile(taskId, testFile);
      assert.strictEqual(rollRes.success, true);

      // 4. Assert restored to original
      current = await workspace.readFile(testFile);
      assert.strictEqual(current.content, originalText);
    });
  });

  describe('SelfCorrectionEngine', () => {
    const testFile = 'test-correction-target.txt';
    const baseContent = 'line 1\n  const targetFunction = () => { return 42; };\nline 3';

    before(async () => {
      await workspace.writeFile(testFile, baseContent);
    });

    after(() => {
      const p = path.resolve(testRoot, testFile);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    it('recovers from whitespace mismatch using fuzzy trim self-correction', async () => {
      const engine = new SelfCorrectionEngine(workspace, shell);

      // Target block has different indentation
      const searchBlock = 'const targetFunction = () => { return 42; };';
      const replaceBlock = 'const targetFunction = () => { return 100; };';

      const res = await engine.correctPatchFailure(testFile, searchBlock, replaceBlock);
      assert.strictEqual(res.recovered, true);

      const modified = await workspace.readFile(testFile);
      assert.ok(modified.content.includes('return 100;'));
    });
  });
});
