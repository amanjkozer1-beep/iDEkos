import { Router } from 'express';
import { SystemController } from '../controllers/SystemController';

export function createSystemRouter(systemController: SystemController): Router {
  const router = Router();

  router.get('/settings', systemController.getSettings);
  router.post('/settings', systemController.updateSettings);

  return router;
}
