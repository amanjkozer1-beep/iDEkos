import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.DEBUG_LOGS === 'true' || res.statusCode >= 400) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
}
