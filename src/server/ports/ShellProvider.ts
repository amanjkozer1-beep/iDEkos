export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  blocked?: boolean;
  reason?: string;
  pid?: number;
}

export interface ValidationResult {
  isAllowed: boolean;
  reason?: string;
  binary?: string;
  argv?: string[];
  requiresApproval?: boolean;
}

export interface ShellProvider {
  executeCommand(rawCommand: string, options?: { timeoutMs?: number }): Promise<CommandResult>;
  validateCommand(rawCommand: string): ValidationResult;
  killCommand(pid: number): boolean;
}
