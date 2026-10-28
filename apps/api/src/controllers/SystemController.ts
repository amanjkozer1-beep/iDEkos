import { Request, Response } from 'express';
import { AgentOrchestrator } from '../services/AgentOrchestrator';

export class SystemController {
  private orchestrator: AgentOrchestrator;
  private settings = {
    autonomyLevel: 'human_approval',
    modelProvider: 'Standard Inference Engine',
    model: 'gemini-3.5-flash-lite',
    maxTokens: 1048576,
    contextCaching: true,
    theme: 'deep_dark',
    fontScale: '100%',
  };

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
    this.orchestrator.setAutonomyLevel('human_approval');
  }

  public getSettings = (_req: Request, res: Response) => {
    res.json(this.settings);
  };

  public updateSettings = (req: Request, res: Response) => {
    this.settings = { ...this.settings, ...req.body };
    if (this.settings.autonomyLevel) {
      this.orchestrator.setAutonomyLevel(this.settings.autonomyLevel as any);
    }
    if (this.settings.model) {
      this.orchestrator.model.setModelName(this.settings.model);
    }
    res.json(this.settings);
  };

  public getHealth = (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      tasksCount: this.orchestrator.getTasks().length,
      autonomyLevel: this.orchestrator.getAutonomyLevel(),
      model: this.orchestrator.model.getModelName(),
      hasModelKey: this.orchestrator.model.hasKey(),
    });
  };
}
