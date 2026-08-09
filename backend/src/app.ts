import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { routes } from './routes';
import { getIntegrationsSeed } from './services/integrationCatalog';
import { Execution } from './models/WorkflowExecution';

export function createApp(): express.Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Public endpoints
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        service: 'flowpilot-api',
        time: new Date().toISOString(),
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        demoMode: env.demoToggle,
      },
    });
  });

  app.use('/api', apiRateLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/** Ensure the built-in integration catalog exists in Mongo. */
export function bootstrapIntegrations(): Promise<void> {
  return getIntegrationsSeed();
}

/** Seed demo data once, so the product looks populated on first open. */
export async function autoSeedDemoData(): Promise<void> {
  if (!env.demoToggle) return;
  const count = await Execution.countDocuments();
  if (count > 0) return;
  const { seedDemoData } = await import('./seed/run.js');
  console.log('[bootstrap] populating demo data...');
  await seedDemoData();
}