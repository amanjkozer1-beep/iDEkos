import { Router } from 'express';
import { AgentOrchestrator } from '../services/AgentOrchestrator';
import { AgentController } from '../controllers/AgentController';
import { WorkspaceController } from '../controllers/WorkspaceController';
import { StorageController } from '../controllers/StorageController';
import { SystemController } from '../controllers/SystemController';
import { createAgentRouter } from './agent.routes';
import { createWorkspaceRouter } from './workspace.routes';
import { createStorageRouter } from './storage.routes';
import { createSystemRouter } from './system.routes';

export function createApiRouter(orchestrator: AgentOrchestrator): Router {
  const router = Router();

  const agentController = new AgentController(orchestrator);
  const workspaceController = new WorkspaceController(orchestrator);
  const storageController = new StorageController(orchestrator);
  const systemController = new SystemController(orchestrator);

  // Mount sub-routers
  router.use('/agent', createAgentRouter(agentController));
  router.use('/workspace', createWorkspaceRouter(workspaceController));
  router.use('/', createStorageRouter(storageController));
  router.use('/system', createSystemRouter(systemController));
  router.get('/health', systemController.getHealth);

  return router;
}
