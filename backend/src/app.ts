import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import healthRoute from './routes/health.js';
import architectureRoute from './routes/architecture.js';
import scenariosRoute from './routes/scenarios.js';
import simulateRoute from './routes/simulate.js';
import repositoryRoute from './routes/repository.js';
import feedbackRoute from './routes/feedback.js';
import recommendRoute from './routes/recommend.js';
import authRoute from './routes/auth.js';

import { loadEnvFiles } from './utils/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  loadEnvFiles();
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // API Routes
  app.use('/api/health', healthRoute);
  app.use('/api/architecture', architectureRoute);
  app.use('/api/scenarios', scenariosRoute);
  app.use('/api/simulate', simulateRoute);
  app.use('/api/repository', repositoryRoute);
  app.use('/api/feedback', feedbackRoute);
  app.use('/api/recommend', recommendRoute);
  app.use('/api/auth', authRoute);

  // Serve static frontend in production if built
  const frontendDistCandidates = [
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(__dirname, '../../../frontend/dist'),
    path.resolve(__dirname, '../../frontend/dist'),
  ];

  for (const distPath of frontendDistCandidates) {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
      break;
    }
  }

  // Centralized Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Unhandled Error]', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred.',
    });
  });

  return app;
}

const defaultApp = createApp();
export default defaultApp;

