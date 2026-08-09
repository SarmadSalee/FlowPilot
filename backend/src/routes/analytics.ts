import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { wrap } from '../utils/http';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get('/summary', wrap(analyticsController.summary));
analyticsRouter.get('/time-series', wrap(analyticsController.timeSeries));
analyticsRouter.get('/used-workflows', wrap(analyticsController.usedWorkflows));
analyticsRouter.get('/recent-executions', wrap(analyticsController.recentExecutions));