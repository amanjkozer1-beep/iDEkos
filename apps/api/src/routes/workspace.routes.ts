import { Router } from 'express';
import { WorkspaceController } from '../controllers/WorkspaceController';

export function createWorkspaceRouter(workspaceController: WorkspaceController): Router {
  const router = Router();

  router.get('/tree', workspaceController.getTree);
  router.get('/file', workspaceController.getFile);
  router.post('/file', workspaceController.saveFile);
  router.post('/create', workspaceController.createItem);
  router.post('/delete', workspaceController.deleteItem);
  router.get('/search', workspaceController.search);
  router.post('/terminal', workspaceController.runTerminal);
  router.get('/git-status', workspaceController.getGitStatus);
  router.get('/diagnostics', workspaceController.getDiagnostics);

  return router;
}
