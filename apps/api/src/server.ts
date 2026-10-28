import express, { Express } from 'express';
import dotenv from 'dotenv';
import { orchestrator, AgentOrchestrator } from './services/AgentOrchestrator';
import { createApiRouter } from './routes';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

export function createApiApp(agentOrchestrator: AgentOrchestrator = orchestrator): Express {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(requestLogger);
  app.use(rateLimiter);
  app.use('/api', authMiddleware);

  // Mount API router
  app.use('/api', createApiRouter(agentOrchestrator));

  // Error handling middleware
  app.use(errorHandler);

  return app;
}

export { orchestrator };

// If executed directly as standalone backend
if (process.env.RUN_STANDALONE === 'true') {
  const PORT = parseInt(process.env.API_PORT || '3001', 10);
  const app = createApiApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[K.O.S Backend API] listening on http://0.0.0.0:${PORT}`);
  });
}
