import { Request, Response } from 'express';
import { AgentOrchestrator } from '../services/AgentOrchestrator';

export class WorkspaceController {
  private orchestrator: AgentOrchestrator;

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
  }

  public getTree = async (_req: Request, res: Response) => {
    try {
      const tree = await this.orchestrator.workspace.getFileTree();
      res.json(tree);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public getFile = async (req: Request, res: Response) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) return res.status(400).json({ error: 'path is required' });

      const startLine = req.query.start ? parseInt(req.query.start as string, 10) : undefined;
      const endLine = req.query.end ? parseInt(req.query.end as string, 10) : undefined;

      const clip = await this.orchestrator.workspace.readFile(filePath, startLine, endLine);
      res.json(clip);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  };

  public saveFile = async (req: Request, res: Response) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || content === undefined) {
        return res.status(400).json({ error: 'path and content are required' });
      }
      await this.orchestrator.workspace.writeFile(filePath, content);
      res.json({ success: true, path: filePath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public createItem = async (req: Request, res: Response) => {
    try {
      const { path: targetPath, isDirectory, content } = req.body;
      if (!targetPath) return res.status(400).json({ error: 'path is required' });
      if (isDirectory) {
        await this.orchestrator.workspace.createDirectory(targetPath);
      } else {
        await this.orchestrator.workspace.createFile(targetPath, content || '');
      }
      res.json({ success: true, path: targetPath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public deleteItem = async (req: Request, res: Response) => {
    try {
      const { path: targetPath } = req.body;
      if (!targetPath) return res.status(400).json({ error: 'path is required' });
      await this.orchestrator.workspace.deletePath(targetPath);
      res.json({ success: true, path: targetPath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public search = async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string) || '';
      if (!query.trim()) return res.json([]);
      const isRegex = req.query.regex === 'true';
      const maxResults = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const matches = await this.orchestrator.workspace.search(query, isRegex, maxResults);
      res.json(matches);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public runTerminal = async (req: Request, res: Response) => {
    try {
      const { command } = req.body;
      if (!command) return res.status(400).json({ error: 'Command is required' });

      const result = await this.orchestrator.shell.executeCommand(command);
      res.json(result);
    } catch (err: any) {
      res.json({
        stdout: '',
        stderr: err.message,
        exitCode: 1,
      });
    }
  };

  public getGitStatus = async (_req: Request, res: Response) => {
    try {
      const result = await this.orchestrator.shell.executeCommand('git status --porcelain');
      const lines = (result.stdout || '').split('\n').filter(Boolean);
      const files = lines.map((line: string) => {
        const status = line.substring(0, 2).trim();
        const file = line.substring(3).trim();
        return { status, file };
      });
      res.json({ files });
    } catch {
      res.json({ files: [] });
    }
  };

  public getDiagnostics = async (_req: Request, res: Response) => {
    try {
      const result = await this.orchestrator.shell.executeCommand('npx tsc --noEmit');
      const raw = (result.stderr ? result.stderr + '\n' : '') + (result.stdout || '');
      const lines = raw.split('\n');
      const problems: Array<{
        file: string;
        line: number;
        col: number;
        severity: 'error' | 'warning';
        code: string;
        message: string;
      }> = [];

      for (const line of lines) {
        const match = line.match(/^(.+?)(?::|\()(\d+)(?:,(\d+)|\:(\d+))(?:\))? -? (error|warning) (TS\d+): (.+)$/);
        if (match) {
          problems.push({
            file: match[1].trim(),
            line: parseInt(match[2], 10),
            col: parseInt(match[3] || match[4] || '1', 10),
            severity: match[5] as 'error' | 'warning',
            code: match[6],
            message: match[7].trim(),
          });
        }
      }

      const cleanLines = lines.filter((l) => !l.startsWith('npm notice') && l.trim().length > 0);
      const cleanRaw = cleanLines.join('\n').trim();

      res.json({
        success: result.exitCode === 0 && problems.length === 0,
        problemsCount: problems.length,
        problems,
        output: cleanRaw || 'Zero TypeScript errors detected across codebase.',
      });
    } catch (err: any) {
      res.json({ success: false, problemsCount: 0, problems: [], output: err.message });
    }
  };
}
