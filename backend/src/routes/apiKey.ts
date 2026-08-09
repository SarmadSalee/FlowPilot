import { Router } from 'express';
import { apiKeyController } from '../controllers/apiKeyController';
import { authenticate, requireRole } from '../middleware/auth';
import { wrap } from '../utils/http';

export const apiKeyRouter = Router();

apiKeyRouter.use(authenticate, requireRole('owner', 'admin', 'member'));

apiKeyRouter.get('/', wrap(apiKeyController.list));
apiKeyRouter.post('/', wrap(apiKeyController.create));
apiKeyRouter.post('/:id/revoke', wrap(apiKeyController.revoke));