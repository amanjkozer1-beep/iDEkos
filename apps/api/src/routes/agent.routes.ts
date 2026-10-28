import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';

export function createAgentRouter(agentController: AgentController): Router {
  const router = Router();

  router.post('/task', agentController.createTask);
  router.get('/tasks', agentController.getTasks);
  router.get('/tasks/:id', agentController.getTask);
  router.get('/stream/:id', agentController.streamTask);
  router.post('/approve', agentController.approveStep);

  return router;
}
