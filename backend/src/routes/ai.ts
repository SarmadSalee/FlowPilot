import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { wrap } from '../utils/http';

export const aiRouter = Router();

aiRouter.use(authenticate);

aiRouter.post('/generate-workflow', aiRateLimiter, wrap(aiController.generateWorkflow));
aiRouter.post('/save-workflow', aiRateLimiter, wrap(aiController.saveGeneratedWorkflow));
aiRouter.post('/generate-text', aiRateLimiter, wrap(aiController.generateText));
aiRouter.post('/analyze', aiRateLimiter, wrap(aiController.analyze));
aiRouter.get('/providers', wrap(aiController.providerStatus));