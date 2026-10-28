import { Request, Response } from 'express';
import { AgentOrchestrator } from '../services/AgentOrchestrator';

export class StorageController {
  private orchestrator: AgentOrchestrator;

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
  }

  // Library
  public getLibrary = (_req: Request, res: Response) => {
    try {
      res.json(this.orchestrator.storage.getLibraryItems());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public addLibrary = (req: Request, res: Response) => {
    try {
      const { title, category, content } = req.body;
      if (!title || !content) return res.status(400).json({ error: 'Title and content required.' });
      const item = {
        id: `lib-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title,
        category: category || 'General',
        content,
        created_at: new Date().toISOString(),
      };
      this.orchestrator.storage.addLibraryItem(item);
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public deleteLibrary = (req: Request, res: Response) => {
    try {
      this.orchestrator.storage.deleteLibraryItem(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // Scheduled Tasks
  public getScheduled = (_req: Request, res: Response) => {
    try {
      res.json(this.orchestrator.storage.getScheduledTasks());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public addScheduled = (req: Request, res: Response) => {
    try {
      const { title, cron_schedule, command } = req.body;
      if (!title || !command) return res.status(400).json({ error: 'Title and command required.' });
      const task = {
        id: `sched-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title,
        cron_schedule: cron_schedule || '0 0 * * *',
        command,
        enabled: 1,
        last_run: 'Never',
        last_status: 'Pending',
      };
      this.orchestrator.storage.addScheduledTask(task);
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public updateScheduled = (req: Request, res: Response) => {
    try {
      this.orchestrator.storage.updateScheduledTask(req.params.id, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public deleteScheduled = (req: Request, res: Response) => {
    try {
      this.orchestrator.storage.deleteScheduledTask(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public runScheduled = async (req: Request, res: Response) => {
    try {
      const tasks = this.orchestrator.storage.getScheduledTasks();
      const task = tasks.find((t: any) => t.id === req.params.id);
      if (!task) return res.status(404).json({ error: 'Scheduled task not found.' });

      const result = await this.orchestrator.shell.executeCommand(task.command);
      const status = result.exitCode === 0 ? 'Passed' : 'Failed';
      this.orchestrator.storage.updateScheduledTask(task.id, {
        last_run: new Date().toLocaleTimeString(),
        last_status: status,
      });

      res.json({ success: true, result, status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // Images
  public getImages = (_req: Request, res: Response) => {
    try {
      res.json(this.orchestrator.storage.getImages());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public addImage = (req: Request, res: Response) => {
    try {
      const { name, data_url, size_kb } = req.body;
      if (!name || !data_url) return res.status(400).json({ error: 'Name and data_url required.' });
      const img = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name,
        data_url,
        created_at: new Date().toISOString(),
        size_kb: size_kb || 1.0,
      };
      this.orchestrator.storage.addImage(img);
      res.json(img);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public deleteImage = (req: Request, res: Response) => {
    try {
      this.orchestrator.storage.deleteImage(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // Daily Brief
  public getDailyBrief = (_req: Request, res: Response) => {
    try {
      res.json(this.orchestrator.storage.getDailyBrief());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
