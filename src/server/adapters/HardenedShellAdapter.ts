import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import {
  ShellProvider,
  CommandResult,
  ValidationResult,
} from '../ports/ShellProvider';

export const ALLOWED_BINARIES = new Set([
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

const INTERPRETERS = new Set(['node', 'npx', 'npm', 'tsx', 'python', 'python3']);

export class HardenedShellAdapter implements ShellProvider {
  private rootPath: string;
  private runningProcesses: Map<number, ChildProcess> = new Map();
  private maxOutputBytes = 1024 * 1024; // 1MB output cap

  constructor(rootPath = (process.env.KOS_WORKSPACE_ROOT || process.cwd())) {
    this.rootPath = path.resolve(rootPath);
  }

  public parseArgv(rawCommand: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote: '"' | "'" | null = null;

    for (let i = 0; i < rawCommand.length; i++) {
      const char = rawCommand[i];

      if (inQuote) {
        if (char === inQuote) {
          inQuote = null;
        } else {
          current += char;
        }
      } else if (char === '"' || char === "'") {
        inQuote = char;
      } else if (/\s/.test(char)) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }

  public validateCommand(rawCommand: string): ValidationResult {
    const trimmed = rawCommand.trim();
    if (!trimmed) {
      return { isAllowed: false, reason: 'Command is empty.' };
    }

    // 1. Strict Shell Metacharacter Check
    const forbiddenMeta = [';', '|', '&', '>', '<', '`', '\n', '\r'];
    for (const char of forbiddenMeta) {
      if (trimmed.includes(char)) {
        return {
          isAllowed: false,
          reason: `Security rejection: Shell metacharacter '${char}' is prohibited in sandboxed execution.`,
        };
      }
    }

    // Reject $(...) command substitution
    if (/\$\(.*\)/.test(trimmed)) {
      return {
        isAllowed: false,
        reason: 'Security rejection: Command substitution $(...) is prohibited.',
      };
    }

    const argv = this.parseArgv(trimmed);
    if (argv.length === 0) {
      return { isAllowed: false, reason: 'Empty command argv.' };
    }

    const binary = path.basename(argv[0]).toLowerCase();

    // 2. Block Destructive Arguments (e.g. rm -rf)
    if (binary === 'rm' || argv.includes('-rf') || argv.includes('-fr') || (argv.includes('-r') && argv.includes('/'))) {
      return {
        isAllowed: false,
        binary,
        reason: 'Command blocked: Recursive deletion or destructive file operations are prohibited.',
      };
    }

    // 3. Allowlist Check
    if (!ALLOWED_BINARIES.has(binary)) {
      return {
        isAllowed: false,
        binary,
        reason: `Command binary "${binary}" is not in the authorized sandbox allowlist.`,
      };
    }

    // 4. Path Escape Check on all arguments
    for (let i = 1; i < argv.length; i++) {
      const arg = argv[i];
      // If arg looks like a file path or traversal
      if (arg.includes('/') || arg.startsWith('.')) {
        if (arg.startsWith('/etc') || arg.startsWith('/root') || arg.startsWith('/var') || arg.startsWith('/bin') || arg.startsWith('/usr')) {
          return {
            isAllowed: false,
            binary,
            reason: `Path access to system directory "${arg}" is prohibited.`,
          };
        }

        const resolved = path.resolve(this.rootPath, arg);
        if (!resolved.startsWith(this.rootPath)) {
          return {
            isAllowed: false,
            binary,
            reason: `Path argument "${arg}" resolves outside workspace root.`,
          };
        }
      }
    }

    const isInterpreter = INTERPRETERS.has(binary);

    return {
      isAllowed: true,
      binary,
      argv,
      requiresApproval: isInterpreter,
    };
  }

  public async executeCommand(
    rawCommand: string,
    options: { timeoutMs?: number } = {}
  ): Promise<CommandResult> {
    const check = this.validateCommand(rawCommand);
    if (!check.isAllowed || !check.argv) {
      return {
        stdout: '',
        stderr: `[K.O.S Sandbox Security]: ${check.reason || 'Command rejected.'}`,
        exitCode: 126,
        blocked: true,
        reason: check.reason,
      };
    }

    const [binary, ...args] = check.argv;

    // Scrubbed environment: Secrets and tokens are strictly excluded!
    const scrubbedEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      HOME: this.rootPath,
      PWD: this.rootPath,
      USER: 'kos',
      LANG: 'en_US.UTF-8',
      TERM: 'xterm-256color',
    };

    return new Promise((resolve) => {
      let stdoutData = '';
      let stderrData = '';
      let stdoutTruncated = false;
      let stderrTruncated = false;
      let isSettled = false;
      const timeoutMs = options.timeoutMs || 60000;

      let child: ChildProcess;
      try {
        child = spawn(binary, args, {
          cwd: this.rootPath,
          env: scrubbedEnv,
          shell: false, // NO SHELL EXECUTION!
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (spawnErr: any) {
        return resolve({
          stdout: '',
          stderr: `Failed to spawn process: ${spawnErr.message}`,
          exitCode: 1,
        });
      }

      if (child.pid) {
        this.runningProcesses.set(child.pid, child);
      }

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          if (child.pid) {
            this.runningProcesses.delete(child.pid);
            try {
              process.kill(-child.pid, 'SIGKILL');
            } catch {
              try { child.kill('SIGKILL'); } catch {}
            }
          }
          resolve({
            stdout: stdoutData + (stdoutTruncated ? '\n[K.O.S Warning: Output truncated at 1MB limit]' : ''),
            stderr: `${stderrData}\n[K.O.S Sandbox]: Command timed out after ${timeoutMs}ms.`,
            exitCode: 124,
          });
        }
      }, timeoutMs);

      child.stdout?.on('data', (chunk) => {
        if (stdoutData.length + chunk.length <= this.maxOutputBytes) {
          stdoutData += chunk.toString();
        } else if (!stdoutTruncated) {
          stdoutTruncated = true;
          const remaining = this.maxOutputBytes - stdoutData.length;
          if (remaining > 0) {
            stdoutData += chunk.toString().slice(0, remaining);
          }
        }
      });

      child.stderr?.on('data', (chunk) => {
        if (stderrData.length + chunk.length <= this.maxOutputBytes) {
          stderrData += chunk.toString();
        } else if (!stderrTruncated) {
          stderrTruncated = true;
          const remaining = this.maxOutputBytes - stderrData.length;
          if (remaining > 0) {
            stderrData += chunk.toString().slice(0, remaining);
          }
        }
      });

      child.on('error', (err) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          if (child.pid) this.runningProcesses.delete(child.pid);
          resolve({
            stdout: stdoutData,
            stderr: `${stderrData}\nError: ${err.message}`,
            exitCode: 1,
          });
        }
      });

      child.on('close', (code) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          if (child.pid) this.runningProcesses.delete(child.pid);
          const finalStdout = stdoutData + (stdoutTruncated ? '\n[K.O.S Warning: Output truncated at 1MB limit]' : '');
          const finalStderr = stderrData + (stderrTruncated ? '\n[K.O.S Warning: Stderr truncated at 1MB limit]' : '');
          resolve({
            stdout: finalStdout,
            stderr: finalStderr,
            exitCode: code ?? 0,
            pid: child.pid,
          });
        }
      });
    });
  }

  public killCommand(pid: number): boolean {
    const proc = this.runningProcesses.get(pid);
    if (proc) {
      try {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          proc.kill('SIGKILL');
        }
        this.runningProcesses.delete(pid);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
