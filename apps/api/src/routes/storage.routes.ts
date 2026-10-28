import { Router } from 'express';
import { StorageController } from '../controllers/StorageController';

export function createStorageRouter(storageController: StorageController): Router {
  const router = Router();

  // Library
  router.get('/library', storageController.getLibrary);
  router.post('/library', storageController.addLibrary);
  router.delete('/library/:id', storageController.deleteLibrary);

  // Scheduled
  router.get('/scheduled', storageController.getScheduled);
  router.post('/scheduled', storageController.addScheduled);
  router.patch('/scheduled/:id', storageController.updateScheduled);
  router.delete('/scheduled/:id', storageController.deleteScheduled);
  router.post('/scheduled/:id/run', storageController.runScheduled);

  // Images
  router.get('/images', storageController.getImages);
  router.post('/images', storageController.addImage);
  router.delete('/images/:id', storageController.deleteImage);

  // Daily Brief
  router.get('/daily-brief', storageController.getDailyBrief);

  return router;
}
