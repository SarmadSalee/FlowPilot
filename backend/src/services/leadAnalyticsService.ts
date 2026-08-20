import { Lead } from '../models/Lead';
import { LeadScoreHistory } from '../models/LeadScoreHistory';

const DAY = 24 * 60 * 60 * 1000;

export const leadAnalyticsService = {
  async summary(organizationId: string) {
    const [leads, history24h, new7d, hot7d] = await Promise.all([
      Lead.find({ organizationId }).lean(),
      LeadScoreHistory.countDocuments({
        organizationId,
        createdAt: { $gte: new Date(Date.now() - DAY) },
      }),
      Lead.countDocuments({ organizationId, createdAt: { $gte: new Date(Date.now() - 7 * DAY) } }),
      LeadScoreHistory.countDocuments({
        organizationId,
        delta: { $gt: 0 },
        createdAt: { $gte: new Date(Date.now() - 7 * DAY) },
      }),
    ]);

    const total = leads.length;
    const avgScore = total ? Math.round(leads.reduce((a, l) => a + (l.score ?? 0), 0) / total) : 0;
    const avgIcp = total ? Math.round(leads.reduce((a, l) => a + (l.icpScore ?? 0), 0) / total) : 0;

    const count = (pred: (l: (typeof leads)[number]) => boolean) => leads.filter(pred).length;

    return {
      totalLeads: total,
      avgScore,
      avgIcpScore: avgIcp,
      hot: count((l) => l.score >= 90 || l.qualification === 'hot'),
      warm: count((l) => l.score >= 70 && l.score < 90),
      cold: count((l) => l.score < 40),
      qualified: count((l) => l.qualification === 'qualified'),
      unqualified: count((l) => l.qualification === 'unqualified'),
      highIntent: count((l) => l.intent === 'high'),
      converted: count((l) => l.status === 'converted'),
      scoreChanges24h: history24h,
      newLeads7d: new7d,
      positiveChanges7d: hot7d,
    };
  },

  /** Score distribution across hot/warm/medium/cold buckets. */
  async distribution(organizationId: string) {
    const leads = await Lead.find({ organizationId }).select('score status').lean();
    const buckets = [
      { label: 'Hot', min: 90, max: 100, count: 0 },
      { label: 'Warm', min: 70, max: 89, count: 0 },
      { label: 'Medium', min: 40, max: 69, count: 0 },
      { label: 'Cold', min: 0, max: 39, count: 0 },
    ];
    for (const l of leads) {
      const b = buckets.find((b) => (l.score ?? 0) >= b.min && (l.score ?? 0) <= b.max);
      if (b) b.count += 1;
    }
    return buckets;
  },

  /** Conversion rate by score range, based on the lead status. */
  async conversionByScoreRange(organizationId: string) {
    const leads = await Lead.find({ organizationId }).select('score status').lean();
    const ranges = [
      { label: '90–100', min: 90, max: 100, total: 0, converted: 0 },
      { label: '80–89', min: 80, max: 89, total: 0, converted: 0 },
      { label: '70–79', min: 70, max: 79, total: 0, converted: 0 },
      { label: '50–69', min: 50, max: 69, total: 0, converted: 0 },
      { label: '0–49', min: 0, max: 49, total: 0, converted: 0 },
    ];
    for (const l of leads) {
      const r = ranges.find((r) => (l.score ?? 0) >= r.min && (l.score ?? 0) <= r.max);
      if (!r) continue;
      r.total += 1;
      if (l.status === 'converted') r.converted += 1;
    }
    return ranges.map((r) => ({
      ...r,
      conversionRate: r.total ? Math.round((r.converted / r.total) * 1000) / 10 : 0,
    }));
  },

  /** Top lead sources by volume + average score. */
  async topSources(organizationId: string, limit = 8) {
    const rows = await Lead.aggregate([
      { $match: { organizationId } },
      { $group: { _id: '$source', count: { $sum: 1 }, avgScore: { $avg: { $ifNull: ['$score', 0] } } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
    return rows.map((r) => ({ source: r._id || 'manual', count: r.count, avgScore: Math.round(r.avgScore) }));
  },

  /** Leads whose score moved the most up/down in the last 7 days. */
  async trendingLeads(organizationId: string, limit = 6) {
    const since = new Date(Date.now() - 7 * DAY);
    const rows = await LeadScoreHistory.aggregate([
      { $match: { organizationId, createdAt: { $gte: since } } },
      { $group: { _id: '$leadId', movement: { $sum: '$delta' }, changes: { $sum: 1 } } },
      { $sort: { movement: -1 } },
      { $limit: limit * 2 },
    ]);
    const ids = rows.map((r) => r._id);
    const leads = ids.length ? await Lead.find({ _id: { $in: ids } }).lean() : [];
    const map = new Map(leads.map((l) => [String(l._id), l]));
    const enrich = (sign: 1 | -1) =>
      rows
        .filter((r) => (sign === 1 ? r.movement > 0 : r.movement < 0))
        .slice(0, limit)
        .map((r) => {
          const lead = map.get(String(r._id));
          return {
            leadId: String(r._id),
            name: lead?.name ?? 'Unknown lead',
            company: lead?.company,
            score: lead?.score ?? 0,
            movement: Math.round(r.movement),
            changes: r.changes,
          };
        });
    return { hottest: enrich(1), coldest: enrich(-1) };
  },

  /** Daily trend: new leads + avg score + score changes. */
  async trend(organizationId: string, days = 14) {
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const [leadRows, historyRows] = await Promise.all([
      Lead.aggregate([
        { $match: { organizationId, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgScore: { $avg: { $ifNull: ['$score', 0] } },
          },
        },
      ]),
      LeadScoreHistory.aggregate([
        { $match: { organizationId, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            changes: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byLead = new Map(leadRows.map((r) => [r._id as string, r]));
    const byHistory = new Map(historyRows.map((r) => [r._id as string, r]));
    const series = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const l = byLead.get(key);
      series.push({
        date: key,
        newLeads: l?.count ?? 0,
        avgScore: l ? Math.round(l.avgScore) : 0,
        scoreChanges: byHistory.get(key)?.changes ?? 0,
      });
    }
    return series;
  },
};