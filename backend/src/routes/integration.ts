import { Router } from 'express';
import { integrationController } from '../controllers/integrationController';
import { authenticate, requireRole } from '../middleware/auth';
import { wrap } from '../utils/http';

export const integrationRouter = Router();

integrationRouter.use(authenticate);

integrationRouter.get('/', wrap(integrationController.list));
integrationRouter.post('/:key/connect', requireRole('owner', 'admin'), wrap(integrationController.connect));
integrationRouter.delete('/:key/disconnect', requireRole('owner', 'admin'), wrap(integrationController.disconnect));