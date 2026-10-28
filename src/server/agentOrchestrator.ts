import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import { StorageProvider, StoredTask, StoredStep, StoredArtifact } from './ports/StorageProvider';
import { WorkspaceProvider } from './ports/WorkspaceProvider';
import { ShellProvider } from './ports/ShellProvider';
import { ModelProvider } from './ports/ModelProvider';
import { SqliteStorageAdapter } from './adapters/SqliteStorageAdapter';
import { LocalWorkspaceAdapter } from './adapters/LocalWorkspaceAdapter';
import { HardenedShellAdapter } from './adapters/HardenedShellAdapter';
import { SdkModelAdapter } from './adapters/SdkModelAdapter';
import { applySearchReplace, generateUnifiedDiff } from './diffEngine';
import { ContextManager } from './context/ContextManager';
import { RollbackManager } from './agent/RollbackManager';
import { TaskDependencyGraph } from './agent/TaskDependencyGraph';
import { SelfCorrectionEngine } from './agent/SelfCorrectionEngine';

export type AgentStepStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed';

export interface AgentStep {
  id: string;
  title: string;
  status: AgentStepStatus;
  timestamp: string;
  command?: string;
  details?: string;
  diffSummary?: string;
  diffText?: string;
  requiresApproval?: boolean;
  toolCallPayload?: {
    toolName: string;
    args: any;
  };
}

export interface AgentArtifact {
  id: string;
  title: string;
  type: 'code' | 'diff' | 'terminal' | 'file';
  preview: string;
  size?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  prompt: string;
  mode: 'task' | 'chat';
  status: 'planning' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  createdAt: string;
  steps: AgentStep[];
  artifacts: AgentArtifact[];
  logs: string[];
}

export class AgentOrchestrator extends EventEmitter {
  private tasks: Map<string, AgentTask> = new Map();
  private rootPath: string;
  private pendingResolvers: Map<string, (approved: boolean) => void> = new Map();
  private autonomyLevel: 'full_auto' | 'human_approval' | 'read_only' = 'human_approval';

  private fileSnapshots: Map<string, string> = new Map();

  public storage: StorageProvider;
  public workspace: WorkspaceProvider;
  public shell: ShellProvider;
  public model: ModelProvider;
  public contextManager: ContextManager;
  public rollbackManager: RollbackManager;
  public taskGraph: TaskDependencyGraph;
  public selfCorrection: SelfCorrectionEngine;

  constructor(
    rootPath = (process.env.KOS_WORKSPACE_ROOT || process.cwd()),
    providers?: {
      storage?: StorageProvider;
      workspace?: WorkspaceProvider;
      shell?: ShellProvider;
      model?: ModelProvider;
    }
  ) {
    super();
    this.rootPath = path.resolve(rootPath);
    this.storage = providers?.storage || new SqliteStorageAdapter();
    this.workspace = providers?.workspace || new LocalWorkspaceAdapter(this.rootPath);
    this.shell = providers?.shell || new HardenedShellAdapter(this.rootPath);
    this.model = providers?.model || new SdkModelAdapter();
    this.contextManager = new ContextManager();
    this.rollbackManager = new RollbackManager(this.workspace);
    this.taskGraph = new TaskDependencyGraph();
    this.selfCorrection = new SelfCorrectionEngine(this.workspace, this.shell);

    this.hydrateFromStorage();
  }

  public setAutonomyLevel(level: 'full_auto' | 'human_approval' | 'read_only') {
    this.autonomyLevel = level;
  }

  public getAutonomyLevel() {
    return this.autonomyLevel;
  }

  private hydrateFromStorage() {
    try {
      const dbTasks = this.storage.getTasks();
      for (const t of dbTasks) {
        const steps = this.storage.getSteps(t.id).map((s) => ({
          id: s.id,
          title: s.title,
          status: s.status as AgentStepStatus,
          timestamp: s.timestamp,
          command: s.command || undefined,
          details: s.details || undefined,
          diffSummary: s.diff_summary || undefined,
          diffText: s.diff_text || undefined,
          requiresApproval: s.requires_approval === 1,
        }));
        const artifacts = this.storage.getArtifacts(t.id).map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type as any,
          preview: a.preview,
          size: a.size || undefined,
        }));
        const logs = this.storage.getLogs(t.id);

        this.tasks.set(t.id, {
          id: t.id,
          title: t.title,
          prompt: t.prompt,
          mode: t.mode as any,
          status: t.status as any,
          createdAt: t.created_at,
          steps,
          artifacts,
          logs,
        });
      }
    } catch (err) {
      console.warn('[K.O.S Storage] Hydration warning:', err);
    }
  }

  public getTasks(): AgentTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getTask(id: string): AgentTask | undefined {
    return this.tasks.get(id);
  }

  private persistTask(task: AgentTask) {
    this.storage.upsertTask({
      id: task.id,
      title: task.title,
      prompt: task.prompt,
      mode: task.mode,
      status: task.status,
      created_at: task.createdAt,
      updated_at: new Date().toISOString(),
    });

    for (const step of task.steps) {
      this.storage.upsertStep({
        id: step.id,
        task_id: task.id,
        title: step.title,
        status: step.status,
        timestamp: step.timestamp,
        command: step.command,
        details: step.details,
        diff_summary: step.diffSummary,
        diff_text: step.diffText,
        requires_approval: step.requiresApproval ? 1 : 0,
      });
    }

    for (const art of task.artifacts) {
      this.storage.addArtifact({
        id: art.id,
        task_id: task.id,
        title: art.title,
        type: art.type,
        preview: art.preview,
        size: art.size,
      });
    }
  }

  public async createTask(prompt: string, mode: 'task' | 'chat' = 'task'): Promise<AgentTask> {
    const id = `kos-${Date.now()}`;
    const title = prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt;

    const task: AgentTask = {
      id,
      title,
      prompt,
      mode,
      status: 'planning',
      createdAt: new Date().toISOString(),
      steps: [],
      artifacts: [],
      logs: [],
    };

    this.tasks.set(id, task);
    this.persistTask(task);
    this.emit('task:update', task);

    // Run real model agent execution loop asynchronously
    this.executeRealAgentLoop(task).catch((err) => {
      task.status = 'failed';
      task.logs.push(`Fatal agent loop error: ${err.message}`);
      this.persistTask(task);
      this.emit('task:update', task);
    });

    return task;
  }

  public async approveStep(taskId: string, stepId: string, approved: boolean): Promise<boolean> {
    const resolver = this.pendingResolvers.get(stepId);
    if (!resolver) {
      return false;
    }

    this.pendingResolvers.delete(stepId);
    resolver(approved);
    return true;
  }

  private async waitForUserApproval(stepId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingResolvers.set(stepId, resolve);
    });
  }

  private pruneContextWindow(contents: any[]): any[] {
    if (contents.length <= 12) return contents;
    const initial = contents[0];
    const recent = contents.slice(contents.length - 8);
    const summaryMarker = {
      role: 'user',
      parts: [
        {
          text: '[Context Compaction]: Earlier exploration steps were compacted to preserve context budget while retaining current objective and recent interactions.',
        },
      ],
    };
    return [initial, summaryMarker, ...recent];
  }

  private truncateToolOutput(text: string, maxLen = 3000): string {
    if (!text || text.length <= maxLen) return text;
    return text.substring(0, maxLen) + `\n... [output truncated: ${text.length - maxLen} additional characters omitted for context limit]`;
  }

  private async executeRealAgentLoop(task: AgentTask) {
    const logMsg = (msg: string) => {
      task.logs.push(msg);
      this.storage.addLog(task.id, msg);
      this.emit('task:update', task);
    };

    logMsg(`[Agent Kernel]: Initialized task execution for prompt: "${task.prompt}"`);

    // Verify Server API Key via port
    if (!this.model.hasKey()) {
      const errorStep: AgentStep = {
        id: `step-${Date.now()}-err`,
        title: 'Model API Key Not Configured',
        status: 'failed',
        timestamp: new Date().toLocaleTimeString(),
        details:
          'Error: Model API key missing from server environment secrets. Please configure MODEL_API_KEY in Settings > Secrets.',
      };
      task.steps.push(errorStep);
      task.status = 'failed';
      logMsg('Execution halted: MODEL_API_KEY is not defined in server environment.');
      this.persistTask(task);
      this.emit('task:update', task);
      return;
    }

    task.status = 'running';

    if (task.mode === 'task') {
      const planStep: AgentStep = {
        id: `step-${Date.now()}-plan`,
        title: 'Formulate Execution Strategy',
        status: 'completed',
        timestamp: new Date().toLocaleTimeString(),
        details: `Analyzed goal: "${task.prompt}". Formulated autonomous exploration, modification, and verification steps.`,
      };
      task.steps.push(planStep);
      this.persistTask(task);
      this.emit('task:update', task);
    }

    const systemPrompt = `You are K.O.S (Kozer Operating System) Autonomous Agentic IDE.
You are running in the project root: "${this.rootPath}".
Your goal is to inspect the codebase, plan tasks, apply surgical patches, run terminal checks, and verify zero errors.

Available Tools:
1. read_file(path, start_line, end_line): Read file contents with optional line clipping.
2. list_dir(path): List entries in workspace directories.
3. search_codebase(query, is_regex, max_results): Search across all workspace files for symbols, strings, or patterns with exact line numbers.
4. write_patch(path, search_block, replace_block): Surgically modify code via exact search & replace. An automatic file snapshot is taken before modification.
5. create_file(path, content): Create new source or configuration files.
6. rollback_file(path): Revert a modified file to its previous state if needed.
7. run_terminal(command): Execute authorized sandboxed shell commands (npm test, tsc, git status, etc.).
8. check_diagnostics(scope): Run TypeScript and build health checks to verify zero errors.

Workflow Guidelines:
- Explore & Search first: locate files and symbols before editing.
- Make surgical changes with write_patch.
- When finished modifying code, run check_diagnostics to verify zero compiler errors before concluding.
- If a patch or command fails, examine the error and hint, read the current lines, and self-correct.`;

    let contents: any[] = [
      {
        role: 'user',
        parts: [{ text: `Task Objective: ${task.prompt}` }],
      },
    ];

    let loopIteration = 0;
    const MAX_ITERATIONS = task.mode === 'task' ? 10 : 6;

    while (loopIteration < MAX_ITERATIONS) {
      loopIteration++;
      logMsg(`[ReAct Iteration ${loopIteration}]: Calling model API with tool declarations...`);

      contents = this.pruneContextWindow(contents);
      const modelResponse = await this.model.askModel(contents, systemPrompt, true);

      if (!modelResponse.isConfigured || modelResponse.error) {
        task.status = 'failed';
        logMsg(`Model invocation error: ${modelResponse.error}`);
        this.persistTask(task);
        return;
      }

      const functionCalls = modelResponse.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const { name, args } = call;
          logMsg(`[Tool Call]: ${name} with args: ${JSON.stringify(args)}`);

          if (name === 'read_file') {
            const step: AgentStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              title: `Read file: ${args.path}`,
              status: 'running',
              timestamp: new Date().toLocaleTimeString(),
              details: `Reading ${args.path}${args.start_line ? ` (lines ${args.start_line}-${args.end_line || ''})` : ''}`,
            };
            task.steps.push(step);
            this.emit('task:update', task);

            try {
              const clip = await this.workspace.readFile(args.path, args.start_line, args.end_line);
              step.status = 'completed';
              step.details = `Read ${clip.content.split('\n').length} lines (total file length: ${clip.totalLines} lines).`;

              contents.push({
                role: 'model',
                parts: [{ functionCall: call }],
              });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'read_file',
                      response: {
                        content: this.truncateToolOutput(clip.content, 4000),
                        totalLines: clip.totalLines,
                      },
                    },
                  },
                ],
              });
            } catch (readErr: any) {
              step.status = 'failed';
              step.details = readErr.message;
              contents.push({
                role: 'model',
                parts: [{ functionCall: call }],
              });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'read_file',
                      response: { error: readErr.message },
                    },
                  },
                ],
              });
            }
          } else if (name === 'list_dir') {
            const step: AgentStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              title: `List Directory: ${args.path || '.'}`,
              status: 'running',
              timestamp: new Date().toLocaleTimeString(),
            };
            task.steps.push(step);
            this.emit('task:update', task);

            try {
              const node = await this.workspace.getFileTree(args.path || '.');
              const entries = node.children?.map((c) => (c.isDirectory ? `${c.name}/` : c.name)) || [];
              step.status = 'completed';
              step.details = `Found ${entries.length} items.`;

              contents.push({
                role: 'model',
                parts: [{ functionCall: call }],
              });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'list_dir',
                      response: { entries },
                    },
                  },
                ],
              });
            } catch (dirErr: any) {
              step.status = 'failed';
              step.details = dirErr.message;
              contents.push({
                role: 'model',
                parts: [{ functionCall: call }],
              });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'list_dir',
                      response: { error: dirErr.message },
                    },
                  },
                ],
              });
            }
          } else if (name === 'search_codebase') {
            const step: AgentStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              title: `Search Codebase: "${args.query}"`,
              status: 'running',
              timestamp: new Date().toLocaleTimeString(),
              details: `Searching pattern "${args.query}" across workspace...`,
            };
            task.steps.push(step);
            this.emit('task:update', task);

            try {
              const matches = await this.workspace.search(args.query, args.is_regex, args.max_results || 30);
              step.status = 'completed';
              step.details = `Found ${matches.length} matches across files.`;
              logMsg(`Found ${matches.length} matches for "${args.query}".`);

              const responseData = {
                count: matches.length,
                matches: matches.slice(0, 25).map((m) => `${m.file}:${m.line} -> ${m.content}`),
              };

              contents.push({ role: 'model', parts: [{ functionCall: call }] });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'search_codebase',
                      response: responseData,
                    },
                  },
                ],
              });
            } catch (searchErr: any) {
              step.status = 'failed';
              step.details = searchErr.message;
              contents.push({ role: 'model', parts: [{ functionCall: call }] });
              contents.push({
                role: 'user',
                parts: [{ functionResponse: { name: 'search_codebase', response: { error: searchErr.message } } }],
              });
            }
          } else if (name === 'create_file') {
            const step: AgentStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              title: `Create File: ${args.path}`,
              status: this.autonomyLevel === 'human_approval' ? 'waiting_approval' : 'running',
              timestamp: new Date().toLocaleTimeString(),
              requiresApproval: this.autonomyLevel === 'human_approval',
              details: `Proposed creating new file "${args.path}" (${args.content.split('\n').length} lines).`,
              toolCallPayload: { toolName: name, args },
            };
            task.steps.push(step);

            if (this.autonomyLevel === 'human_approval') {
              task.status = 'waiting_approval';
              logMsg(`[Approval Gate]: Creating file "${args.path}" is paused waiting for user approval.`);
              this.persistTask(task);
              this.emit('task:update', task);

              const approved = await this.waitForUserApproval(step.id);
              if (!approved) {
                step.status = 'failed';
                step.details = 'File creation rejected by developer.';
                logMsg(`Creation of ${args.path} was denied.`);
                task.status = 'completed';
                this.persistTask(task);
                this.emit('task:update', task);
                return;
              }
            }

            try {
              try {
                const existing = await this.workspace.readFile(args.path);
                this.fileSnapshots.set(`${task.id}:${args.path}`, existing.content);
              } catch {}

              await this.workspace.writeFile(args.path, args.content);
              step.status = 'completed';
              step.details = `Successfully created ${args.path} (${args.content.split('\n').length} lines).`;
              logMsg(`Created file ${args.path}`);

              task.artifacts.push({
                id: `art-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                title: path.basename(args.path),
                type: 'file',
                preview: args.content.substring(0, 1000),
                size: `${Math.round((args.content.length / 1024) * 10) / 10} KB`,
              });

              contents.push({ role: 'model', parts: [{ functionCall: call }] });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'create_file',
                      response: { success: true, path: args.path },
                    },
                  },
                ],
              });
            } catch (err: any) {
              step.status = 'failed';
              step.details = err.message;
              contents.push({ role: 'model', parts: [{ functionCall: call }] });
              contents.push({
                role: 'user',
                parts: [{ functionResponse: { name: 'create_file', response: { success: false, error: err.message } } }],
              });
            }
          } else if (name === 'rollback_file') {
            const step: AgentStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              title: `Rollback File: ${args.path}`,
              status: 'running',
              timestamp: new Date().toLocaleTimeString(),
              details: `Attempting to restore ${args.path} to previous snapshot...`,
            };
            task.steps.push(step);
            this.emit('task:update', task);

            const snapshot = this.fileSnapshots.get(`${task.id}:${args.path}`);
            if (snapshot !== undefined) {
              await this.workspace.writeFile(args.path, snapshot);
              step.status = 'completed';
              step.details = `Restored ${args.path} to snapshot (${snapshot.split('\n').length} lines).`;
              logMsg(`Rolled back ${args.path} to previous version.`);

              contents.push({ role: 'model', parts: [{ functionCall: call }] });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'rollback_file',
                      response: { success: true, message: `File ${args.path} rolled back successfully.` },
                    },
                  },
                ],
              });
            } else {
              step.status = 'failed';
              step.details = `No previous snapshot available for ${args.path}.`;
              contents.push({ role: 'model', parts: [{ functionCall: call }] });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'rollback_file',
                      response: {
                        success: false,
                        error: `No snapshot found for file ${args.path}. Ensure the file was modified earlier in this task.`,
                      },
                    },
                  },
                ],
              });
            }
          } else if (name === 'check_diagnostics') {
            const step: AgentStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              title: 'Check TypeScript & Build Diagnostics',
              status: 'running',
              timestamp: new Date().toLocaleTimeString(),
              details: 'Running automated typecheck verification...',
            };
            task.steps.push(step);
            this.emit('task:update', task);

            const diagResult = await this.shell.executeCommand('npx tsc --noEmit');
            if (diagResult.exitCode === 0) {
              step.status = 'completed';
              step.details = 'Zero TypeScript errors detected across codebase.';
              logMsg('Diagnostics passed: 0 errors.');

              contents.push({ role: 'model', parts: [{ functionCall: call }] });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'check_diagnostics',
                      response: { clean: true, summary: 'Zero TypeScript errors detected.' },
                    },
                  },
                ],
              });
            } else {
              step.status = 'failed';
              step.details = diagResult.stderr || diagResult.stdout || 'Type errors found.';
              logMsg(`Diagnostics flagged issues:\n${(diagResult.stderr || diagResult.stdout).substring(0, 300)}`);

              contents.push({ role: 'model', parts: [{ functionCall: call }] });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'check_diagnostics',
                      response: {
                        clean: false,
                        errors: this.truncateToolOutput(diagResult.stderr || diagResult.stdout, 1500),
                        hint: 'Inspect the reported errors and modify the relevant files to fix type issues before completing the task.',
                      },
                    },
                  },
                ],
              });
            }
          } else if (name === 'write_patch') {
            const step: AgentStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              title: `Apply Surgical Patch: ${args.path}`,
              status: this.autonomyLevel === 'human_approval' ? 'waiting_approval' : 'running',
              timestamp: new Date().toLocaleTimeString(),
              requiresApproval: this.autonomyLevel === 'human_approval',
              details: `Proposed diff for ${args.path}. Awaiting developer approval.`,
              toolCallPayload: { toolName: name, args },
            };
            task.steps.push(step);

            let originalContent = '';
            try {
              const readRes = await this.workspace.readFile(args.path);
              originalContent = readRes.content;
              this.fileSnapshots.set(`${task.id}:${args.path}`, originalContent);
            } catch {
              originalContent = '';
            }

            const patchSimulation = applySearchReplace(
              originalContent,
              args.search_block,
              args.replace_block
            );
            if (patchSimulation.success) {
              const diffResult = generateUnifiedDiff(originalContent, patchSimulation.result, args.path);
              step.diffSummary = `+${diffResult.linesAdded} -${diffResult.linesRemoved} lines in ${args.path}`;
              step.diffText = diffResult.diffText;

              task.artifacts.push({
                id: `art-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                title: `${path.basename(args.path)}.patch`,
                type: 'diff',
                preview: diffResult.diffText,
                size: `${Math.round((diffResult.diffText.length / 1024) * 10) / 10} KB`,
              });
            }

            if (this.autonomyLevel === 'human_approval') {
              task.status = 'waiting_approval';
              logMsg(`[Approval Gate]: Step "${step.title}" is paused waiting for user approval.`);
              this.persistTask(task);
              this.emit('task:update', task);

              const approved = await this.waitForUserApproval(step.id);
              if (!approved) {
                step.status = 'failed';
                step.details = 'Patch rejected by developer.';
                logMsg(`Patch to ${args.path} was denied.`);
                task.status = 'completed';
                this.persistTask(task);
                this.emit('task:update', task);
                return;
              }
            }

            if (patchSimulation.success) {
              await this.workspace.writeFile(args.path, patchSimulation.result);
              step.status = 'completed';
              step.details = `Patch successfully applied to ${args.path}.`;
              logMsg(`Applied surgical patch to ${args.path}.`);

              contents.push({
                role: 'model',
                parts: [{ functionCall: call }],
              });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'write_patch',
                      response: { success: true, message: `Patch applied to ${args.path}` },
                    },
                  },
                ],
              });
            } else {
              step.status = 'failed';
              step.details = patchSimulation.error || 'Failed to match search block.';
              contents.push({
                role: 'model',
                parts: [{ functionCall: call }],
              });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'write_patch',
                      response: {
                        success: false,
                        error: patchSimulation.error,
                        hint: 'Search block did not match target file. Call read_file on this file to verify exact lines, whitespace, and indentation, then re-call write_patch with the exact matching lines.',
                      },
                    },
                  },
                ],
              });
            }
          } else if (name === 'run_terminal') {
            const step: AgentStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              title: `Run Terminal Command: ${args.command}`,
              status: this.autonomyLevel === 'human_approval' ? 'waiting_approval' : 'running',
              timestamp: new Date().toLocaleTimeString(),
              command: args.command,
              requiresApproval: this.autonomyLevel === 'human_approval',
              details: `Executing "${args.command}" inside project root sandbox.`,
              toolCallPayload: { toolName: name, args },
            };
            task.steps.push(step);

            if (this.autonomyLevel === 'human_approval') {
              task.status = 'waiting_approval';
              logMsg(`[Approval Gate]: Terminal execution "${args.command}" is paused waiting for user approval.`);
              this.persistTask(task);
              this.emit('task:update', task);

              const approved = await this.waitForUserApproval(step.id);
              if (!approved) {
                step.status = 'failed';
                step.details = 'Command rejected by developer.';
                logMsg(`Command "${args.command}" was denied.`);
                task.status = 'completed';
                this.persistTask(task);
                this.emit('task:update', task);
                return;
              }
            }

            const cmdResult = await this.shell.executeCommand(args.command);
            if (cmdResult.exitCode === 0) {
              step.status = 'completed';
              step.details = cmdResult.stdout || 'Command completed with code 0.';
              logMsg(`Command output:\n${cmdResult.stdout.substring(0, 300)}`);

              contents.push({
                role: 'model',
                parts: [{ functionCall: call }],
              });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'run_terminal',
                      response: {
                        exitCode: 0,
                        stdout: this.truncateToolOutput(cmdResult.stdout, 2000),
                        stderr: this.truncateToolOutput(cmdResult.stderr, 1000),
                      },
                    },
                  },
                ],
              });
            } else {
              step.status = 'failed';
              step.details = cmdResult.stderr || `Exited with code ${cmdResult.exitCode}`;
              contents.push({
                role: 'model',
                parts: [{ functionCall: call }],
              });
              contents.push({
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'run_terminal',
                      response: {
                        exitCode: cmdResult.exitCode,
                        stderr: this.truncateToolOutput(cmdResult.stderr, 2000),
                        stdout: this.truncateToolOutput(cmdResult.stdout, 1000),
                        hint: 'Command exited with non-zero status. Inspect the error output and adjust your changes before concluding.',
                      },
                    },
                  },
                ],
              });
            }
          }

          this.persistTask(task);
          this.emit('task:update', task);
        }
      } else {
        const finalStep: AgentStep = {
          id: `step-${Date.now()}-done`,
          title: 'Agent Task Completed',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
          details: modelResponse.text || 'Task execution finished successfully.',
        };
        task.steps.push(finalStep);
        task.status = 'completed';
        logMsg('Agent goal reached. Task completed.');
        this.persistTask(task);
        this.emit('task:update', task);
        break;
      }
    }

    if (task.status !== 'completed') {
      task.status = 'completed';
      this.persistTask(task);
      this.emit('task:update', task);
    }
  }
}

export const orchestrator = new AgentOrchestrator();
