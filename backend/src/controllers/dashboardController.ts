import type { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { Treasury } from '../utils/treasury';
import { ok } from '../utils/http';

export const dashboardController = {
  async overview(req: Request, res: Response) {
    const orgId = String(req.org!._id);
    const [summary, recent, timeSeries, usedWorkflows] = await Promise.all([
      analyticsService.summary(orgId),
      analyticsService.recentExecutions(orgId, 8),
      analyticsService.timeSeries(orgId, 14),
      analyticsService.usedWorkflow(orgId, 5),
    ]);

    const HOUR = 60 * 60 * 1000;
    const last24h = recent.filter((r) => {
      const t = new Date(r.startedAt as unknown as string).getTime();
      return Date.now() - t < 24 * HOUR;
    }).length;

    return ok(res, {
      summary,
      recent,
      timeSeries,
      usedWorkflows,
      last24hExecutions: last24h,
      credits: Treasury.credits(String(req.org!.plan ?? 'free'), summary.tokenUsage),
    });
  },

  async creditsLight(_req: Request, res: Response) {
    const summary = await analyticsService.summary(String(_req.org!._id));
    return ok(
      res,
      Treasury.credits(String(_req.org!.plan ?? 'free'), summary.tokenUsage)
    );
  },
};