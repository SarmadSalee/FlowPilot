import type { Request, Response } from 'express';
import { leadService } from '../services/leadService';
import { enqueueLeadEvent, rescoreLead } from '../services/leadScoringService';
import { leadAnalyticsService } from '../services/leadAnalyticsService';
import { leadRuleService } from '../services/leadRuleService';
import { leadIcpService } from '../services/leadIcpService';
import { attachLeadStream } from '../services/leadEventBus';
import { LeadEvent } from '../models/LeadEvent';
import { ok } from '../utils/http';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

function orgId(req: Request): string {
  return String(req.org!._id);
}

function userId(req: Request): string {
  return String(req.user!._id);
}

export const leadController = {
  async list(req: Request, res: Response) {
    const items = await leadService.list(orgId(req), req.query as never);
    return ok(res, items);
  },

  async analytics(req: Request, res: Response) {
    const id = orgId(req);
    const [summary, distribution, conversion, topSources, trending, trend] = await Promise.all([
      leadAnalyticsService.summary(id),
      leadAnalyticsService.distribution(id),
      leadAnalyticsService.conversionByScoreRange(id),
      leadAnalyticsService.topSources(id),
      leadAnalyticsService.trendingLeads(id),
      leadAnalyticsService.trend(id, 14),
    ]);
    return ok(res, { summary, distribution, conversion, topSources, trending, trend });
  },

  async getById(req: Request, res: Response) {
    const detail = await leadService.detail(orgId(req), req.params.id);
    return ok(res, detail);
  },

  async create(req: Request, res: Response) {
    const result = await leadService.create(orgId(req), userId(req), req.body);
    return ok(res, result);
  },

  async update(req: Request, res: Response) {
    const lead = await leadService.update(orgId(req), req.params.id, req.body);
    return ok(res, lead);
  },

  async remove(req: Request, res: Response) {
    await leadService.remove(orgId(req), req.params.id);
    return ok(res, { message: 'Lead deleted' });
  },

  /** Add an activity event → async re-scoring + live feed. */
  async addEvent(req: Request, res: Response) {
    const result = await enqueueLeadEvent(orgId(req), req.params.id, req.body);
    return ok(res, result);
  },

  async rescore(req: Request, res: Response) {
    const outcome = await rescoreLead(orgId(req), req.params.id, userId(req), req.body?.reason);
    return ok(res, outcome);
  },

  async timeline(req: Request, res: Response) {
    const rows = await leadService.timeline(orgId(req), req.params.id);
    return ok(res, rows);
  },

  async rules(req: Request, res: Response) {
    const rules = await leadRuleService.list(orgId(req));
    return ok(res, rules);
  },

  async createRule(req: Request, res: Response) {
    const rule = await leadRuleService.create(orgId(req), req.body);
    return ok(res, rule);
  },

  async updateRule(req: Request, res: Response) {
    const rule = await leadRuleService.update(orgId(req), req.params.id, req.body);
    return ok(res, rule);
  },

  async removeRule(req: Request, res: Response) {
    await leadRuleService.remove(orgId(req), req.params.id);
    return ok(res, { message: 'Scoring rule deleted' });
  },

  async compileRule(req: Request, res: Response) {
    const compiled = leadRuleService.compile(req.body.description);
    return ok(res, compiled);
  },

  async getIcp(req: Request, res: Response) {
    const profile = await leadIcpService.get(orgId(req));
    return ok(res, profile);
  },

  async upsertIcp(req: Request, res: Response) {
    const profile = await leadIcpService.upsert(orgId(req), req.body);
    return ok(res, profile);
  },

  async removeIcp(req: Request, res: Response) {
    await leadIcpService.remove(orgId(req));
    return ok(res, { message: 'ICP profile removed' });
  },

  /** SSE live feed. Auth via query token for EventSource compatibility. */
  async stream(req: Request, res: Response) {
    let org: { _id: unknown } | null = req.org ?? null;
    if (!org && req.query.token) {
      try {
        const payload = verifyToken(String(req.query.token));
        org = { _id: payload.orgId };
      } catch {
        throw ApiError.unauthorized('Invalid stream token');
      }
    }
    if (!org) throw ApiError.unauthorized('Authentication required');

    const id = String(org._id);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Replay recent processed events so a freshly connected client is not empty.
    const replay = LeadEvent.find({ organizationId: id, processed: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .then((events) => {
        for (const e of events) {
          res.write(`data: ${JSON.stringify({ type: 'event_processed', organizationId: id, leadId: String(e.leadId), eventType: e.type, scoreDelta: e.scoreDelta, createdAt: e.createdAt })}\n\n`);
        }
      })
      .catch(() => undefined);

    const cleanup = attachLeadStream(res, id, () => undefined);
    void replay;
    res.on('close', cleanup);
    res.on('error', cleanup);
  },
};