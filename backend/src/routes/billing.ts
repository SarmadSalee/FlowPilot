import { Router } from 'express';
import { billingController } from '../controllers/billingController';
import { authenticate, requireRole } from '../middleware/auth';
import { wrap } from '../utils/http';

export const billingRouter = Router();

billingRouter.get('/plans', wrap(billingController.plans));
billingRouter.get('/current', authenticate, wrap(billingController.current));
billingRouter.post('/checkout', authenticate, requireRole('owner', 'admin'), wrap(billingController.checkout));
billingRouter.post('/cancel', authenticate, requireRole('owner', 'admin'), wrap(billingController.cancel));