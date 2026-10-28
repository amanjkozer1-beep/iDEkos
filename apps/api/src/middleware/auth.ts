import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  const expectedKey = process.env.KOS_API_SECRET;

  // If a secret is defined in environment, enforce it for /api requests except health check
  if (expectedKey && req.path !== '/health') {
    if (!apiKey || (apiKey !== expectedKey && apiKey !== `Bearer ${expectedKey}`)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key.' });
    }
  }

  next();
}
