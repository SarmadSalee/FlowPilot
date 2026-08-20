import { Router } from 'express';
import { leadController } from '../controllers/leadController';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { wrap } from '../utils/http';
import {
  createLeadSchema,
  updateLeadSchema,
  addLeadEventSchema,
  listLeadsQuerySchema,
  scoringRuleSchema,
  compileRuleSchema,
  icpProfileSchema,
} from '../validation/lead';

export const leadRouter = Router();

// Live feed is token-aware and handled separately.
leadRouter.get('/stream', optionalAuth, wrap(leadController.stream));

leadRouter.use(authenticate);

leadRouter.get('/', validate(listLeadsQuerySchema, 'query'), wrap(leadController.list));
leadRouter.get('/analytics', wrap(leadController.analytics));
leadRouter.get('/rules', wrap(leadController.rules));
leadRouter.post('/rules', requireRole('owner', 'admin', 'member'), validate(scoringRuleSchema, 'body'), wrap(leadController.createRule));
leadRouter.post('/rules/compile', requireRole('owner', 'admin', 'member'), validate(compileRuleSchema, 'body'), wrap(leadController.compileRule));
leadRouter.put('/rules/:id', requireRole('owner', 'admin', 'member'), validate(scoringRuleSchema.partial(), 'body'), wrap(leadController.updateRule));
leadRouter.delete('/rules/:id', requireRole('owner', 'admin', 'member'), wrap(leadController.removeRule));
leadRouter.get('/icp', wrap(leadController.getIcp));
leadRouter.put('/icp', requireRole('owner', 'admin', 'member'), validate(icpProfileSchema, 'body'), wrap(leadController.upsertIcp));
leadRouter.delete('/icp', requireRole('owner', 'admin', 'member'), wrap(leadController.removeIcp));

leadRouter.post('/', requireRole('owner', 'admin', 'member'), validate(createLeadSchema, 'body'), wrap(leadController.create));
leadRouter.get('/:id', wrap(leadController.getById));
leadRouter.put('/:id', requireRole('owner', 'admin', 'member'), validate(updateLeadSchema, 'body'), wrap(leadController.update));
leadRouter.delete('/:id', requireRole('owner', 'admin', 'member'), wrap(leadController.remove));
leadRouter.post('/:id/events', requireRole('owner', 'admin', 'member'), validate(addLeadEventSchema, 'body'), wrap(leadController.addEvent));
leadRouter.post('/:id/rescore', requireRole('owner', 'admin', 'member'), wrap(leadController.rescore));
leadRouter.get('/:id/timeline', wrap(leadController.timeline));