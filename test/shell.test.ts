import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HardenedShellAdapter } from '../src/server/adapters/HardenedShellAdapter';

describe('HardenedShellAdapter Security & Isolation Suite', () => {
  const shell = new HardenedShellAdapter(process.cwd());

  it('rejects commands containing shell metacharacters (; | & > < ` newline)', async () => {
    const metachars = [
      'ls; cat package.json',
      'ls | grep src',
      'ls && echo hacked',
      'echo test > test.txt',
      'cat < package.json',
      'echo `whoami`',
      'ls\nwhoami',
    ];

    for (const cmd of metachars) {
      const res = await shell.executeCommand(cmd);
      assert.strictEqual(res.blocked, true, `Expected command "${cmd}" to be blocked`);
      assert.strictEqual(res.exitCode, 126);
      assert.ok(res.stderr.includes('metacharacter') || res.stderr.includes('prohibited'));
    }
  });

  it('rejects command substitution $(...)', async () => {
    const res = await shell.executeCommand('echo $(whoami)');
    assert.strictEqual(res.blocked, true);
    assert.strictEqual(res.exitCode, 126);
  });

  it('rejects unauthorized binaries', async () => {
    const unauthorized = ['bash -c "id"', 'sh -c "ls"', 'curl https://example.com', 'wget https://example.com'];
    for (const cmd of unauthorized) {
      const res = await shell.executeCommand(cmd);
      assert.strictEqual(res.blocked, true);
      assert.strictEqual(res.exitCode, 126);
      assert.ok(res.stderr.includes('not in the authorized sandbox allowlist'));
    }
  });

  it('rejects destructive commands (rm -rf /)', async () => {
    const res = await shell.executeCommand('rm -rf /');
    assert.strictEqual(res.blocked, true);
    assert.strictEqual(res.exitCode, 126);
    assert.ok(res.stderr.includes('Recursive deletion') || res.stderr.includes('prohibited'));
  });

  it('blocks path traversal to system files (cat /etc/passwd)', async () => {
    const res = await shell.executeCommand('cat /etc/passwd');
    assert.strictEqual(res.blocked, true);
    assert.strictEqual(res.exitCode, 126);
  });

  it('executes real child process date +%s%N producing distinct dynamic timestamps', async () => {
    const r1 = await shell.executeCommand('date +%s%N');
    assert.strictEqual(r1.exitCode, 0, `Execution failed: ${r1.stderr}`);
    const t1 = r1.stdout.trim();
    assert.ok(t1.length >= 10, `Expected nanosecond timestamp, got: "${t1}"`);

    // Call again to verify dynamic distinct execution without simulation
    const r2 = await shell.executeCommand('date +%s%N');
    assert.strictEqual(r2.exitCode, 0);
    const t2 = r2.stdout.trim();
    assert.ok(t2.length >= 10);
    assert.notStrictEqual(t1, t2, 'Subsequent date +%s%N runs must produce distinct timestamps!');
  });

  it('scrubs child process environment to guarantee zero secrets leak', async () => {
    // Set temporary process.env secrets in parent
    process.env.MODEL_API_KEY = 'secret-model-key-12345';
    process.env.APP_SECRET_TOKEN = 'secret-app-token-67890';
    process.env.SUPER_SECRET_TOKEN = 'secret-token-xyz';

    const cmd = "node -e 'console.log(JSON.stringify(process.env))'";
    const res = await shell.executeCommand(cmd);

    assert.strictEqual(res.exitCode, 0, `Execution failed: ${res.stderr}`);
    const childEnv = JSON.parse(res.stdout);

    // Assert that parent secrets are NOT present in child process environment
    assert.strictEqual(childEnv.MODEL_API_KEY, undefined, 'MODEL_API_KEY must never leak to child!');
    assert.strictEqual(childEnv.APP_SECRET_TOKEN, undefined, 'APP_SECRET_TOKEN must never leak to child!');
    assert.strictEqual(childEnv.SUPER_SECRET_TOKEN, undefined, 'Parent secrets must never leak to child!');
    assert.strictEqual(childEnv.USER, 'kos', 'Expected scrubbed user');
  });
});
