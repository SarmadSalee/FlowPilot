import { Router } from 'express';
import { workflowController } from '../controllers/workflowController';
import { authenticate, requireRole } from '../middleware/auth';
import { wrap } from '../utils/http';

export const workflowRouter = Router();

workflowRouter.use(authenticate);

workflowRouter.get('/', wrap(workflowController.list));
workflowRouter.post('/', requireRole('owner', 'admin', 'member'), wrap(workflowController.create));
workflowRouter.get('/:id', wrap(workflowController.getById));
workflowRouter.put('/:id', requireRole('owner', 'admin', 'member'), wrap(workflowController.update));
workflowRouter.patch('/:id/status', requireRole('owner', 'admin', 'member'), wrap(workflowController.changeStatus));
workflowRouter.delete('/:id', requireRole('owner', 'admin', 'member'), wrap(workflowController.remove));
workflowRouter.post('/:id/run', requireRole('owner', 'admin', 'member'), wrap(workflowController.run));
workflowRouter.post('/:id/test', requireRole('owner', 'admin', 'member'), wrap(workflowController.test));