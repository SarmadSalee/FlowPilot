import { Router } from 'express';
import { agentController } from '../controllers/agentController';
import { authenticate, requireRole } from '../middleware/auth';
import { wrap } from '../utils/http';

export const agentRouter = Router();

agentRouter.use(authenticate);

agentRouter.get('/', wrap(agentController.list));
agentRouter.post('/', requireRole('owner', 'admin', 'member'), wrap(agentController.create));
agentRouter.get('/:id', wrap(agentController.getById));
agentRouter.put('/:id', requireRole('owner', 'admin'), wrap(agentController.update));
agentRouter.delete('/:id', requireRole('owner', 'admin'), wrap(agentController.remove));
agentRouter.post('/:id/run', requireRole('owner', 'admin', 'member'), wrap(agentController.run));