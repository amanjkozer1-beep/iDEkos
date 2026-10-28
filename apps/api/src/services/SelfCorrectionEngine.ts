/**
 * Self-Correction & Autonomous Recovery Engine for K.O.S
 * Provides strategies for recovering from patch mismatches, missing files, and terminal errors.
 */

import { WorkspaceProvider } from '../ports/WorkspaceProvider';
import { ShellProvider } from '../ports/ShellProvider';
import { applySearchReplace } from './diffEngine';

export interface CorrectionResult {
  recovered: boolean;
  strategyUsed?: string;
  data?: any;
  error?: string;
}

export class SelfCorrectionEngine {
  private workspace: WorkspaceProvider;
  private shell: ShellProvider;

  constructor(workspace: WorkspaceProvider, shell: ShellProvider) {
    this.workspace = workspace;
    this.shell = shell;
  }

  /**
   * Attempts self-correction when write_patch fails
   */
  public async correctPatchFailure(
    filePath: string,
    searchBlock: string,
    replaceBlock: string
  ): Promise<CorrectionResult> {
    try {
      const readRes = await this.workspace.readFile(filePath);
      const original = readRes.content;

      // Strategy 1: Fuzzy trim match (via diffEngine)
      const sim = applySearchReplace(original, searchBlock, replaceBlock);
      if (sim.success) {
        await this.workspace.writeFile(filePath, sim.result);
        return {
          recovered: true,
          strategyUsed: 'fuzzy_whitespace_trim',
          data: { result: sim.result },
        };
      }

      // Strategy 2: Single line trimmed target match if search block is 1 line
      const searchLines = searchBlock.trim().split('\n').map((l) => l.trim());
      if (searchLines.length === 1) {
        const fileLines = original.split('\n');
        const matchIdx = fileLines.findIndex((l) => l.trim() === searchLines[0]);
        if (matchIdx !== -1) {
          fileLines[matchIdx] = replaceBlock;
          const recoveredContent = fileLines.join('\n');
          await this.workspace.writeFile(filePath, recoveredContent);
          return {
            recovered: true,
            strategyUsed: 'single_line_exact_trim',
            data: { result: recoveredContent },
          };
        }
      }

      return {
        recovered: false,
        error: `Could not locate search block within ${filePath}.`,
      };
    } catch (err: any) {
      return {
        recovered: false,
        error: err.message,
      };
    }
  }

  /**
   * Attempts self-correction for terminal command errors
   */
  public async correctCommandFailure(command: string, exitCode: number, stderr: string): Promise<CorrectionResult> {
    const trimmed = command.trim();

    // Strategy 1: npm install missing flag or cache
    if (trimmed.startsWith('npm install') && exitCode !== 0) {
      const retryCmd = `${trimmed} --legacy-peer-deps`;
      const retryRes = await this.shell.executeCommand(retryCmd);
      if (retryRes.exitCode === 0) {
        return {
          recovered: true,
          strategyUsed: 'npm_legacy_peer_deps_fallback',
          data: retryRes,
        };
      }
    }

    // Strategy 2: tsc syntax diagnostics guidance
    if (trimmed.includes('tsc') && exitCode !== 0) {
      return {
        recovered: false,
        strategyUsed: 'diagnostics_feedback',
        error: `TypeScript compiler detected issues: ${stderr.substring(0, 300)}`,
      };
    }

    return {
      recovered: false,
      error: `Command failed with exitCode ${exitCode}`,
    };
  }
}
