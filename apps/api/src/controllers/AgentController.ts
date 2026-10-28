import { Request, Response } from 'express';
import { AgentOrchestrator } from '../services/AgentOrchestrator';

export class AgentController {
  private orchestrator: AgentOrchestrator;

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
  }

  public createTask = async (req: Request, res: Response) => {
    try {
      const { prompt, mode = 'task' } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const task = await this.orchestrator.createTask(prompt.trim(), mode);
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public getTasks = (_req: Request, res: Response) => {
    res.json(this.orchestrator.getTasks());
  };

  public getTask = (req: Request, res: Response) => {
    const task = this.orchestrator.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json(task);
  };

  public streamTask = (req: Request, res: Response) => {
    const { id } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendUpdate = (task: any) => {
      if (task.id === id) {
        res.write(`data: ${JSON.stringify(task)}\n\n`);
      }
    };

    const currentTask = this.orchestrator.getTask(id);
    if (currentTask) {
      res.write(`data: ${JSON.stringify(currentTask)}\n\n`);
    }

    this.orchestrator.on('task:update', sendUpdate);

    req.on('close', () => {
      this.orchestrator.off('task:update', sendUpdate);
    });
  };

  public approveStep = async (req: Request, res: Response) => {
    try {
      const { taskId, stepId, approved } = req.body;
      const success = await this.orchestrator.approveStep(taskId, stepId, approved !== false);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
