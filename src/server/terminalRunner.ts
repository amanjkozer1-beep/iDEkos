import { exec, spawn } from 'child_process';
import path from 'path';

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  blocked?: boolean;
  reason?: string;
}

export const ALLOWED_COMMAND_BINARIES = new Set([
  'npm',
  'node',
  'npx',
  'git',
  'ls',
  'cat',
  'pwd',
  'echo',
  'grep',
  'find',
  'head',
  'tail',
  'wc',
  'tsc',
  'mkdir',
  'touch',
  'cp',
  'mv',
  'stat',
  'which',
  'uname',
  'date',
  'diff',
  'tsx',
  'tree',
  'true',
  'false',
]);

export function validateCommandSafety(
  rawCommand: string,
  rootPath = (process.env.KOS_WORKSPACE_ROOT || process.cwd())
): { isAllowed: boolean; reason?: string; binary?: string } {
  const trimmed = rawCommand.trim();
  if (!trimmed) {
    return { isAllowed: false, reason: 'Command is empty.' };
  }

  // Check destructive command patterns
  const destructivePatterns = [
    /rm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+|\s+-r)/i, // rm -rf, rm -r
    /\bsudo\b/i,
    /\bmkfs\b/i,
    /\bdd\b\s+if=/i,
    /:()\s*\{\s*:\s*\|\s*:\s*&\s*\};\s*:/, // Fork bomb
    />\s*\/dev\/[a-z]+/i,
    /\bcurl\b.*\|\s*(sh|bash)/i,
    /\bwget\b.*\|\s*(sh|bash)/i,
    /\bchmod\s+-[rR]\s+777\b/i,
  ];

  for (const pattern of destructivePatterns) {
    if (pattern.test(trimmed)) {
      return {
        isAllowed: false,
        reason: 'Command blocked: contains potentially destructive or unauthorized instruction.',
      };
    }
  }

  // Prevent directory traversal outside rootPath
  if (trimmed.includes('../..') || trimmed.includes('/etc/') || trimmed.includes('/root/')) {
    return {
      isAllowed: false,
      reason: 'Command blocked: path traversal outside project workspace is prohibited.',
    };
  }

  // Extract primary binary name (handling environment prefixes like PAGER=cat)
  const segments = trimmed.split(/&&|\|\||;/).map((s) => s.trim());
  for (const segment of segments) {
    const tokens = segment.split(/\s+/).filter(Boolean);
    let binaryToken = tokens[0];

    // Skip environment variables like FOO=bar
    let i = 0;
    while (binaryToken && binaryToken.includes('=') && !binaryToken.startsWith('./')) {
      i++;
      binaryToken = tokens[i];
    }

    if (!binaryToken) continue;

    const baseBinary = path.basename(binaryToken).toLowerCase();
    if (!ALLOWED_COMMAND_BINARIES.has(baseBinary)) {
      return {
        isAllowed: false,
        binary: baseBinary,
        reason: `Command binary "${baseBinary}" is not in the authorized sandbox allowlist.`,
      };
    }
  }

  return { isAllowed: true };
}

export function executeSandboxedCommand(
  rawCommand: string,
  rootPath = (process.env.KOS_WORKSPACE_ROOT || process.cwd()),
  timeoutMs = 25000
): Promise<CommandExecutionResult> {
  return new Promise((resolve) => {
    const check = validateCommandSafety(rawCommand, rootPath);
    if (!check.isAllowed) {
      return resolve({
        stdout: '',
        stderr: `[K.O.S Sandbox Security]: ${check.reason}`,
        exitCode: 126,
        blocked: true,
        reason: check.reason,
      });
    }

    exec(
      rawCommand,
      {
        cwd: rootPath,
        shell: '/bin/bash',
        timeout: timeoutMs,
        maxBuffer: 2 * 1024 * 1024,
        env: {
          ...process.env,
          PWD: rootPath,
          PATH: process.env.PATH,
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          return resolve({
            stdout: stdout || '',
            stderr: stderr || error.message,
            exitCode: error.code || 1,
          });
        }
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: 0,
        });
      }
    );
  });
}
