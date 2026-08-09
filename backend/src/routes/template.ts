import { Router } from 'express';
import { templateController } from '../controllers/templateController';
import { authenticate, requireRole } from '../middleware/auth';
import { wrap } from '../utils/http';

export const templateRouter = Router();

templateRouter.get('/', wrap(templateController.list));
templateRouter.get('/:slug', wrap(templateController.getBySlug));
templateRouter.post('/:slug/use', authenticate, requireRole('owner', 'admin', 'member'), wrap(templateController.useTemplate));