import dns from 'node:dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import healthRoute from './routes/health.js';
import architectureRoute from './routes/architecture.js';
import scenariosRoute from './routes/scenarios.js';
import simulateRoute from './routes/simulate.js';
import repositoryRoute from './routes/repository.js';
import feedbackRoute from './routes/feedback.js';
import recommendRoute from './routes/recommend.js';
import authRoute from './routes/auth.js';
import historyRoute from './routes/history.js';
import chatRoute from './routes/chat.js';
import telemetryRoute from './routes/telemetry.js';
import feedRoute from './feed/feedRoutes.js';
import adminRoute from './routes/admin.js';
import meetingRoutes from './meeting/meetingRoutes.js';
import paymentRoute from './routes/payment.js';
import { telemetryMiddleware } from './middleware/telemetry.js';

import { loadEnvFiles } from './utils/env.js';
loadEnvFiles();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  loadEnvFiles();
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Security Headers Middleware
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  const allowedOrigins = [
    'https://gitoscale.com',
    'https://www.gitoscale.com',
    'https://gittoscale.tech',
    'https://www.gittoscale.tech',
    'https://gitoscale.vercel.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, or automated test runners)
        if (!origin) return callback(null, true);

        const isAllowedVercelDeployment =
          /^https:\/\/gitoscale(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin) ||
          (origin.endsWith('.vercel.app') && process.env.NODE_ENV !== 'production');

        if (
          process.env.NODE_ENV !== 'production' ||
          allowedOrigins.includes(origin) ||
          isAllowedVercelDeployment ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        }
        return callback(new Error('CORS origin blocked by security policy'));
      },
      credentials: true,
    })
  );

  app.use(
    express.json({
      limit: '15mb',
      verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ limit: '15mb', extended: true }));
  app.use(telemetryMiddleware);

  // API Routes
  app.use('/api/health', healthRoute);
  app.use('/api/architecture', architectureRoute);
  app.use('/api/scenarios', scenariosRoute);
  app.use('/api/simulate', simulateRoute);
  app.use('/api/repository', repositoryRoute);
  app.use('/api/feedback', feedbackRoute);
  app.use('/api/recommend', recommendRoute);
  app.use('/api/auth', authRoute);
  app.use('/api/history', historyRoute);
  app.use('/api/chat', chatRoute);
  app.use('/api/telemetry', telemetryRoute);
  app.use('/api/feed', feedRoute);
  app.use('/api/admin', adminRoute);
  app.use('/api/meetings', meetingRoutes);
  app.use('/api/payment', paymentRoute);

  // Serve uploaded media if present (in development or non-Vercel environments)
  const localUploadsPath = path.resolve(process.cwd(), 'uploads');
  const tmpUploadsPath = path.join(os.tmpdir(), 'uploads');

  if (!process.env.VERCEL) {
    try {
      if (!fs.existsSync(localUploadsPath)) {
        fs.mkdirSync(localUploadsPath, { recursive: true });
      }
    } catch (err: any) {
      console.warn('[App] Local uploads directory not initialized:', err?.message);
    }
  }

  // Ensure tmp directory exists safely using recursive: true
  try {
    if (!fs.existsSync(tmpUploadsPath)) {
      fs.mkdirSync(tmpUploadsPath, { recursive: true });
    }
  } catch (err: any) {
    console.warn('[App] Tmp uploads directory not initialized:', err?.message);
  }

  if (fs.existsSync(localUploadsPath)) {
    app.use('/uploads', express.static(localUploadsPath));
  }
  if (fs.existsSync(tmpUploadsPath)) {
    app.use('/uploads', express.static(tmpUploadsPath));
  }

  // Serve static frontend in production if built
  const frontendDistCandidates = [
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(__dirname, '../../../frontend/dist'),
    path.resolve(__dirname, '../../frontend/dist'),
  ];

  for (const distPath of frontendDistCandidates) {
    if (fs.existsSync(distPath)) {
      app.use(
        express.static(distPath, {
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
              // HTML must never be cached indefinitely so new deployments are fetched immediately
              res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
            } else if (filePath.includes(`${path.sep}assets${path.sep}`) || filePath.includes('/assets/')) {
              // Vite-hashed immutable assets (JS/CSS) cached in browser for 1 year
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else {
              // Images, favicons, fonts, static icons cached with stale-while-revalidate
              res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
            }
          },
        })
      );
      app.get('*', (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
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

