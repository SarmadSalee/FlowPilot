import { Router } from 'express';
import { teamController } from '../controllers/teamController';
import { authenticate, requireRole } from '../middleware/auth';
import { wrap } from '../utils/http';

export const teamRouter = Router();

teamRouter.use(authenticate);

teamRouter.get('/', wrap(teamController.list));
teamRouter.post('/invite', requireRole('owner', 'admin'), wrap(teamController.invite));
teamRouter.post('/accept-invite', wrap(teamController.acceptInvite));
teamRouter.patch('/members/:userId/role', requireRole('owner', 'admin'), wrap(teamController.changeRole));
teamRouter.delete('/members/:userId', requireRole('owner', 'admin'), wrap(teamController.removeMember));
teamRouter.get('/activity', wrap(teamController.activityLog));