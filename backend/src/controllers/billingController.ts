import type { Request, Response } from 'express';
import { billingService } from '../services/billingService';
import { ok } from '../utils/http';

export const billingController = {
  async plans(_req: Request, res: Response) {
    return ok(res, billingService.plans);
  },

  async current(req: Request, res: Response) {
    return ok(res, await billingService.current(String(req.org!._id)));
  },

  async checkout(req: Request, res: Response) {
    const result = await billingService.checkout(String(req.org!._id), req.body.plan);
    return ok(res, result);
  },

  async cancel(req: Request, res: Response) {
    return ok(res, await billingService.cancel(String(req.org!._id)));
  },
};