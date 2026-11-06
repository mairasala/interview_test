import express, { type Express } from 'express';
import type { Deps } from './container';
import { authenticate } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { claimsRouter } from './routes/claims';

export function createApp(deps: Deps): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/claims', authenticate, claimsRouter(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
