import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { LocalWorkspaceAdapter } from '../src/server/adapters/LocalWorkspaceAdapter';

describe('LocalWorkspaceAdapter Integration Suite', () => {
  const testRoot = process.cwd();
  const workspace = new LocalWorkspaceAdapter(testRoot);

  it('correctly builds workspace file tree and excludes ignored directories', async () => {
    const tree = await workspace.getFileTree();
    assert.strictEqual(tree.isDirectory, true);
    assert.ok(tree.children && tree.children.length > 0);

    const childNames = tree.children.map((c) => c.name);
    assert.ok(childNames.includes('src'), 'Expected src/ in tree');
    assert.ok(childNames.includes('package.json'), 'Expected package.json in tree');
    assert.strictEqual(childNames.includes('node_modules'), false, 'node_modules must be excluded');
    assert.strictEqual(childNames.includes('.git'), false, '.git must be excluded');
  });

  it('reads file content with start and end line clipping', async () => {
    const clip = await workspace.readFile('package.json', 1, 5);
    assert.ok(clip.content.length > 0);
    assert.strictEqual(clip.range[0], 1);
    assert.strictEqual(clip.range[1], 5);
    const lineCount = clip.content.split('\n').length;
    assert.strictEqual(lineCount, 5);
  });

  it('blocks path traversal and outside root file reading', async () => {
    await assert.rejects(
      async () => {
        await workspace.readFile('../../etc/passwd');
      },
      /Access denied: path escapes workspace root/
    );
  });

  it('rejects sibling paths that merely share the workspace root prefix', () => {
    const siblingPath = `${testRoot}-outside/secret.txt`;
    assert.strictEqual(workspace.isPathSafe(siblingPath), false);
  });

  it('safely validates paths against workspace root, handling leading slashes cleanly', async () => {
    assert.strictEqual(workspace.isPathSafe('src/frontend/App.tsx'), true);
    assert.strictEqual(workspace.isPathSafe('/src/frontend/App.tsx'), true);
    assert.strictEqual(workspace.isPathSafe('./package.json'), true);
    assert.strictEqual(workspace.isPathSafe('/package.json'), true);

    assert.strictEqual(workspace.isPathSafe('../outside.txt'), false);
    assert.strictEqual(workspace.isPathSafe('/etc/shadow'), false);
    assert.strictEqual(workspace.isPathSafe('/etc/passwd'), false);

    // Reading with leading slash should succeed seamlessly
    const clip = await workspace.readFile('/package.json', 1, 3);
    assert.ok(clip.content.includes('{'));
  });

  it('searches codebase for query with line matching', async () => {
    const results = await workspace.search('AgentOrchestrator', false, 5);
    assert.ok(results.length > 0);
    assert.ok(results[0].file.length > 0);
    assert.ok(results[0].line > 0);
    assert.ok(results.some((r) => r.content.includes('AgentOrchestrator')));
  });

  it('safely creates, reads, and deletes temporary files and directories inside workspace', async () => {
    const tempFile = 'temp-test-file.txt';
    const tempDir = 'temp-test-dir';

    await workspace.createFile(tempFile, 'Hello KOS IDE');
    const readBack = await workspace.readFile(tempFile);
    assert.strictEqual(readBack.content, 'Hello KOS IDE');

    await workspace.createDirectory(tempDir);
    assert.ok(fs.existsSync(path.resolve(testRoot, tempDir)));

    await workspace.deletePath(tempFile);
    assert.strictEqual(fs.existsSync(path.resolve(testRoot, tempFile)), false);

    await workspace.deletePath(tempDir);
    assert.strictEqual(fs.existsSync(path.resolve(testRoot, tempDir)), false);
  });

  it('prevents deleting root directory or outside escape paths', async () => {
    await assert.rejects(
      async () => {
        await workspace.deletePath('/');
      },
      /Access denied/
    );

    await assert.rejects(
      async () => {
        await workspace.deletePath('../outside');
      },
      /Access denied/
    );
  });
});

