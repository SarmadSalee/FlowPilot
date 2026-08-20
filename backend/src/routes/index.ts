import { Router } from 'express';
import { authRouter } from './auth';
import { workflowRouter } from './workflow';
import { executionRouter } from './execution';
import { aiRouter } from './ai';
import { integrationRouter } from './integration';
import { agentRouter } from './agent';
import { templateRouter } from './template';
import { analyticsRouter } from './analytics';
import { apiKeyRouter } from './apiKey';
import { teamRouter } from './team';
import { billingRouter } from './billing';
import { notificationRouter } from './notification';
import { leadRouter } from './lead';
import { dashboardController } from '../controllers/dashboardController';
import { NODE_DEFINITIONS } from '../automation/nodes';
import { authenticate } from '../middleware/auth';
import { wrap } from '../utils/http';

export const routes = Router();

routes.use('/auth', authRouter);
routes.use('/workflows', workflowRouter);
routes.use('/executions', executionRouter);
routes.use('/ai', aiRouter);
routes.use('/integrations', integrationRouter);
routes.use('/agents', agentRouter);
routes.use('/templates', templateRouter);
routes.use('/analytics', analyticsRouter);
routes.use('/api-keys', apiKeyRouter);
routes.use('/team', teamRouter);
routes.use('/billing', billingRouter);
routes.use('/notifications', notificationRouter);
routes.use('/leads', leadRouter);
routes.get('/nodes', (_req, res) => {
  res.json({ success: true, data: NODE_DEFINITIONS });
});
routes.get('/dashboard', authenticate, wrap(dashboardController.overview));
routes.get('/dashboard/credits', authenticate, wrap(dashboardController.creditsLight));