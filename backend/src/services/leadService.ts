import { Lead } from '../models/Lead';
import { LeadScore } from '../models/LeadScore';
import { LeadScoreHistory } from '../models/LeadScoreHistory';
import { LeadEvent } from '../models/LeadEvent';
import { LeadAnalysis } from '../models/LeadAnalysis';
import { createLeadAndScore, scoreLead } from './leadScoringService';
import { ApiError } from '../utils/ApiError';

export interface LeadListFilters {
  search?: string;
  status?: string;
  intent?: string;
  qualification?: string;
  minScore?: number;
  maxScore?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

const SORTABLE: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  score_desc: { score: -1 },
  score_asc: { score: 1 },
  icp_desc: { icpScore: -1 },
  updated: { updatedAt: -1 },
};

export const leadService = {
  async list(organizationId: string, filters: LeadListFilters) {
    const query: Record<string, unknown> = { organizationId };
    if (filters.search) {
      const re = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: re }, { email: re }, { company: re }, { jobTitle: re }];
    }
    if (filters.status && filters.status !== 'all') query.status = filters.status;
    if (filters.intent && filters.intent !== 'all') query.intent = filters.intent;
    if (filters.qualification && filters.qualification !== 'all') query.qualification = filters.qualification;
    if (filters.minScore != null) query.score = { ...(query.score as object), $gte: filters.minScore };
    if (filters.maxScore != null) query.score = { ...(query.score as object), $lte: filters.maxScore };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const sort = SORTABLE[filters.sort ?? 'newest'] ?? SORTABLE.newest;

    const [items, total] = await Promise.all([
      Lead.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Lead.countDocuments(query),
    ]);

    return {
      leads: items,
      total,
      page,
      limit,
    };
  },

  async getById(organizationId: string, leadId: string) {
    const lead = await Lead.findOne({ _id: leadId, organizationId }).lean();
    if (!lead) throw ApiError.notFound('Lead not found');
    return lead;
  },

  /** Full intelligence detail: lead + latest score snapshot + analysis + timeline + events. */
  async detail(organizationId: string, leadId: string) {
    const lead = await Lead.findOne({ _id: leadId, organizationId }).lean();
    if (!lead) throw ApiError.notFound('Lead not found');

    const [score, analyses, history, events] = await Promise.all([
      LeadScore.findOne({ leadId: lead._id, organizationId }).lean(),
      LeadAnalysis.find({ leadId: lead._id, organizationId }).sort({ createdAt: -1 }).limit(5).lean(),
      LeadScoreHistory.find({ leadId: lead._id, organizationId }).sort({ createdAt: -1 }).limit(100).lean(),
      LeadEvent.find({ leadId: lead._id, organizationId }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    return { lead, score, analyses, history, events };
  },

  async create(organizationId: string, userId: string, input: Record<string, unknown>) {
    const { leadId, outcome } = await createLeadAndScore(organizationId, userId, input);
    return { leadId, outcome };
  },

  async update(organizationId: string, leadId: string, input: Record<string, unknown>) {
    const allowed = [
      'name', 'email', 'company', 'jobTitle', 'industry', 'companySize', 'location',
      'website', 'revenue', 'source', 'leadType', 'phone', 'whatsapp', 'status', 'tags',
      'customData', 'metadata',
    ];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    if (input.email === '') patch.email = undefined;

    const lead = await Lead.findOneAndUpdate({ _id: leadId, organizationId }, { $set: patch }, { new: true }).lean();
    if (!lead) throw ApiError.notFound('Lead not found');

    // Re-score after the profile changes, without blocking the response.
    setImmediate(() => {
      scoreLead(organizationId, String(lead._id), { source: 'manual', reason: 'Lead profile updated' }).catch(() => undefined);
    });

    return lead;
  },

  async remove(organizationId: string, leadId: string) {
    const lead = await Lead.findOneAndDelete({ _id: leadId, organizationId }).lean();
    if (!lead) throw ApiError.notFound('Lead not found');
    await Promise.all([
      LeadScore.deleteMany({ leadId: lead._id, organizationId }),
      LeadScoreHistory.deleteMany({ leadId: lead._id, organizationId }),
      LeadEvent.deleteMany({ leadId: lead._id, organizationId }),
      LeadAnalysis.deleteMany({ leadId: lead._id, organizationId }),
    ]);
    return lead;
  },

  /** Merged timeline of score changes and activity, newest first. */
  async timeline(organizationId: string, leadId: string) {
    await leadService.getById(organizationId, leadId);
    const [history, events] = await Promise.all([
      LeadScoreHistory.find({ leadId, organizationId }).sort({ createdAt: -1 }).lean(),
      LeadEvent.find({ leadId, organizationId }).sort({ createdAt: -1 }).lean(),
    ]);
    const rows = [
      ...history.map((h) => ({
        kind: 'score' as const,
        id: String(h._id),
        at: h.createdAt,
        score: h.score,
        previousScore: h.previousScore,
        delta: h.delta,
        reason: h.reason ?? 'Score updated',
        source: h.source,
        eventType: h.eventType,
      })),
      ...events.map((e) => ({
        kind: 'event' as const,
        id: String(e._id),
        at: e.createdAt,
        type: e.type,
        channel: e.channel,
        scoreDelta: e.scoreDelta,
        detectedIntent: e.detectedIntent,
        reason: e.payload?.text ? String(e.payload.text).slice(0, 160) : e.type,
      })),
    ];
    rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return rows;
  },
};