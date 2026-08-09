import type { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { ok } from '../utils/http';

export const analyticsController = {
  async summary(req: Request, res: Response) {
    return ok(res, await analyticsService.summary(String(req.org!._id)));
  },

  async timeSeries(req: Request, res: Response) {
    const days = Math.min(90, Math.max(1, Number(req.query.days ?? 30)));
    return ok(res, await analyticsService.timeSeries(String(req.org!._id), days));
  },

  async usedWorkflows(req: Request, res: Response) {
    return ok(res, await analyticsService.usedWorkflow(String(req.org!._id)));
  },

  async recentExecutions(req: Request, res: Response) {
    return ok(res, await analyticsService.recentExecutions(String(req.org!._id)));
  },
};