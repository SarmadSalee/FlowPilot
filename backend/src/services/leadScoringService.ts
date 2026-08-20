import crypto from 'node:crypto';
import { Lead } from '../models/Lead';
import { LeadScore } from '../models/LeadScore';
import { LeadScoreHistory } from '../models/LeadScoreHistory';
import { LeadEvent } from '../models/LeadEvent';
import { LeadAnalysis } from '../models/LeadAnalysis';
import { ICPProfile } from '../models/ICPProfile';
import { ScoringRule, type RuleAction } from '../models/ScoringRule';
import { NotificationModel } from '../models/Notification';
import { Organization } from '../models/Organization';
import { Workflow } from '../models/Workflow';
import { workflowService } from './workflowService';
import { leadEventBus } from './leadEventBus';
import {
  computeDeterministicScore,
  analyzeLeadWithAi,
  conditionsMatch,
  EVENT_WEIGHTS,
  NEGATIVE_WEIGHTS,
  detectIntentSignals,
  fallbackRecommendation,
  gradeFor,
  matchIcp,
  type ScoreFactor,
  type DeterministicScoreResult,
} from '../ai/leadScorer';
import { ApiError } from '../utils/ApiError';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export interface ScoreOutcome {
  leadId: string;
  leadName: string;
  score: number;
  previousScore: number;
  delta: number;
  grade: string;
  intent: string;
  qualification: string;
  buyingStage: string;
  confidence: number;
  icpScore: number;
  factors: ScoreFactor[];
  reason: string;
  recommendedAction: { title: string; steps: string[]; urgency: string };
  provider: string;
  model: string;
  ruleEffects: string[];
}

async function loadIcp(orgId: string) {
  return ICPProfile.findOne({ organizationId: orgId, enabled: true }).lean();
}

function eventText(evt: { payload?: Record<string, unknown> | null }): string {
  return [evt.payload?.text, evt.payload?.body, evt.payload?.message, evt.payload?.subject]
    .filter(Boolean)
    .join(' ');
}

/** Apply a rule action to a score. Returns delta/effect string. */
function applyRuleAction(
  score: number,
  action: RuleAction
): { delta: number; effect: string; tags: string[]; notifications: string[] } {
  const value = Number(action.value ?? 0);
  switch (action.type) {
    case 'increase':
      return { delta: value, effect: `Rule: increase score by ${value}`, tags: [], notifications: [] };
    case 'decrease':
      return { delta: -value, effect: `Rule: decrease score by ${value}`, tags: [], notifications: [] };
    case 'set':
      return { delta: clamp(Number(action.value ?? 0)) - score, effect: `Rule: set score to ${action.value}`, tags: [], notifications: [] };
    case 'set_intent':
      return { delta: 0, effect: `Rule: set intent to ${action.value}`, tags: [], notifications: [] };
    case 'set_qualification':
      return { delta: 0, effect: `Rule: set qualification to ${action.value}`, tags: [], notifications: [] };
    case 'set_stage':
      return { delta: 0, effect: `Rule: set buying stage to ${action.value}`, tags: [], notifications: [] };
    case 'add_tag':
      return { delta: 0, effect: `Rule: add tag ${action.value}`, tags: [String(action.value)], notifications: [] };
    case 'remove_tag':
      return { delta: 0, effect: `Rule: remove tag ${action.value}`, tags: [], notifications: [] };
    case 'unsubscribe':
      return { delta: 0, effect: `Rule: unsubscribed`, tags: [], notifications: [] };
    case 'notify':
      return { delta: 0, effect: `Rule: notify ${action.target ?? 'team'}`, tags: [], notifications: [String(action.target ?? 'team')] };
    case 'trigger_workflow':
      return { delta: 0, effect: `Rule: trigger workflow ${action.value}`, tags: [], notifications: [] };
    case 'stop':
      return { delta: 0, effect: `Rule: stop processing`, tags: [], notifications: [] };
    default:
      return { delta: 0, effect: '', tags: [], notifications: [] };
  }
}

async function orgFirstMemberId(orgId: string): Promise<string> {
  const org = await Organization.findById(orgId).lean();
  const first = org?.members?.[0]?.userId;
  return first ? String(first) : '000000000000000000000000';
}

async function notifyTeam(orgId: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  const org = await Organization.findById(orgId).lean();
  const members = org?.members ?? [];
  await NotificationModel.insertMany(
    members.map((m) => ({
      userId: m.userId,
      organizationId: orgId,
      type: 'success',
      title,
      body,
      data,
    }))
  );
}

/** Trigger active workflows that listen to lead scoring/activity events. */
async function triggerScoreWorkflows(
  orgId: string,
  lead: { _id: unknown; name: string; company?: string | null; email?: string | null },
  score: number,
  prevScore: number,
  eventType?: string
): Promise<void> {
  try {
    const userId = await orgFirstMemberId(orgId);
    const workflows = await Workflow.find({ organizationId: orgId, status: 'active' }).lean();
    for (const wf of workflows) {
      const triggerNode = (wf.nodes ?? []).find((n) => n.type === 'trigger');
      if (!triggerNode) continue;
      const key = triggerNode.key;
      if (key !== 'lead_scored' && key !== 'lead_activity') continue;
      if (key === 'lead_activity' && eventType) {
        const cfgEventType = String((triggerNode.config as Record<string, unknown> | undefined)?.eventType ?? '');
        if (cfgEventType && cfgEventType !== 'any' && cfgEventType !== eventType) continue;
      }
      const payload = {
        lead: {
          _id: String(lead._id),
          name: lead.name,
          company: lead.company,
          email: lead.email,
        },
        score,
        previous_score: prevScore,
        delta: score - prevScore,
        qualified: score >= 70,
        event_type: eventType,
      };
      try {
        await workflowService.run(orgId, userId, String(wf._id), { triggerData: payload, test: false });
      } catch (err) {
        console.error('[lead-scoring] workflow trigger failed:', err);
      }
    }
  } catch (err) {
    console.error('[lead-scoring] triggerScoreWorkflows failed:', err);
  }
}

export interface ScoreLeadOptions {
  source?: 'initial' | 'event' | 'manual' | 'ai';
  eventId?: string;
  eventType?: string;
  reason?: string;
  userId?: string;
  runAi?: boolean;
}

/**
 * Recomputes a lead's intelligence state end-to-end: deterministic factors,
 * AI analysis, scoring rules, then persists Lead, LeadScore, history,
 * analysis and emits the real-time event. Never throws on AI failure.
 */
export async function scoreLead(orgId: string, leadId: string, opts: ScoreLeadOptions = {}): Promise<ScoreOutcome> {
  const lead = await Lead.findOne({ _id: leadId, organizationId: orgId }).lean();
  if (!lead) throw ApiError.notFound('Lead not found');

  const [events, icp, rules] = await Promise.all([
    LeadEvent.find({ leadId, organizationId: orgId }).sort({ createdAt: -1 }).limit(200).lean(),
    loadIcp(orgId),
    ScoringRule.find({ organizationId: orgId, enabled: true }).sort({ priority: -1 }).lean(),
  ]);

  const prevScore = lead.score ?? 0;
  const deterministic: DeterministicScoreResult = computeDeterministicScore(lead, events, icp);
  const icpMatch = matchIcp(lead, icp);

  // AI analysis (structured, validated, non-fatal)
  const ai = opts.runAi === false
    ? { ok: false, provider: 'builtin', model: 'builtin' }
    : await analyzeLeadWithAi({
        lead,
        currentScore: deterministic.score,
        events,
        icpMatch,
        simulate: process.env.NODE_ENV !== 'production',
      });

  let score = ai.ok && (ai.confidence ?? 0) >= 0.5
    ? clamp(Math.round(deterministic.score * 0.55 + (ai.score ?? deterministic.score) * 0.45))
    : deterministic.score;

  // Apply scoring rules
  const ruleEffects: string[] = [];
  const tagAdds: string[] = [];
  const tagRemoves: string[] = [];
  let notified = false;
  let stop = false;

  for (const rule of rules) {
    if (stop) break;
    const ctx: Record<string, unknown> = {
      score,
      intent: ai.ok ? ai.intent : deterministic.intent,
      qualification: ai.ok ? ai.qualification : deterministic.qualification,
      event_type: opts.eventType,
      lead_industry: lead.industry,
      lead_company: lead.company,
      source: lead.source,
      ...(lead.customData as Record<string, unknown> | undefined),
    };
    const matches =
      rule.trigger === 'score_threshold'
        ? conditionsMatch(rule.conditions, ctx)
        : rule.trigger === 'lead_event'
          ? Boolean(opts.eventType) && (!rule.eventType || rule.eventType === opts.eventType)
          : rule.trigger === 'lead_created'
            ? opts.source === 'initial'
            : false;

    if (!matches) continue;
    const applied = applyRuleAction(score, rule.action);
    score = clamp(score + applied.delta);
    if (applied.effect) ruleEffects.push(applied.effect);
    tagAdds.push(...applied.tags);
    if (rule.action.type === 'remove_tag') tagRemoves.push(String(rule.action.value));
    if (rule.action.type === 'notify') {
      notified = true;
      if (!opts.userId) {
        await notifyTeam(orgId, `Hot lead: ${lead.name}`, `Score is now ${score}/100 — ${applied.effect}.`).catch(() => undefined);
      }
    }
    if (rule.action.type === 'trigger_workflow') {
      const wfId = String(rule.action.value ?? '');
      if (wfId) {
        const userId = opts.userId ?? (await orgFirstMemberId(orgId));
        workflowService.run(orgId, userId, wfId, {
          triggerData: { lead: { _id: String(lead._id), name: lead.name }, score, previous_score: prevScore, delta: score - prevScore },
          test: false,
        }).catch((err) => console.error('[lead-scoring] rule workflow trigger failed:', err));
      }
    }
    if (rule.action.type === 'stop') stop = true;
  }

  // Qualitative fields: prefer AI, fall back to deterministic
  const intent = ai.ok ? ai.intent! : deterministic.intent;
  const qualification = ai.ok ? ai.qualification! : deterministic.qualification;
  const buyingStage = ai.ok ? ai.buyingStage! : deterministic.buyingStage;
  const confidence = ai.ok ? (ai.confidence ?? 0.5) : 0.5;

  const recommendedAction = ai.ok && ai.recommendedAction
    ? {
        title: ai.recommendedAction,
        steps: ai.recommendedSteps ?? [],
        urgency: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
      }
    : fallbackRecommendation(score, qualification);

  // Build factor list (dedupe AI summaries into factors list)
  const factors: ScoreFactor[] = [...deterministic.factors];
  if (ai.ok) {
    for (const p of ai.positiveFactors ?? []) {
      factors.push({ label: p, delta: 0, kind: 'positive', source: 'ai' });
    }
    for (const n of ai.negativeFactors ?? []) {
      factors.push({ label: n, delta: 0, kind: 'negative', source: 'ai' });
    }
  }

  const reason = ai.ok && ai.reason ? ai.reason : `Scored ${score}/100 based on engagement and profile fit`;

  // Upsert LeadScore snapshot
  await LeadScore.findOneAndUpdate(
    { leadId: lead._id },
    {
      $set: {
        organizationId: orgId,
        leadId: lead._id,
        score,
        grade: gradeFor(score),
        intent,
        qualification,
        buyingStage,
        confidence: Math.round(confidence * 100) / 100,
        icpMatch: icpMatch.score,
        engagement: deterministic.engagementScore,
        buyingIntent: deterministic.intentScore,
        factors,
        summary: reason,
        explanation: reason,
        recommendedAction,
        provider: ai.provider,
        model: ai.model,
        analyzedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).exec();

  // Persist analysis run
  try {
    await LeadAnalysis.create({
      organizationId: orgId,
      leadId: lead._id,
      score,
      intent,
      qualification,
      buyingStage,
      confidence: Math.round(confidence * 100) / 100,
      reasons: factors.map((f) => f.label),
      summary: reason,
      recommendedAction: recommendedAction.title,
      recommendedSteps: recommendedAction.steps,
      source: opts.source ?? 'ai',
      provider: ai.provider,
      model: ai.model,
      inputSnapshot: { leadName: lead.name, score, prevScore, eventType: opts.eventType },
    });
  } catch (err) {
    console.error('[lead-scoring] analysis persist failed:', err);
  }

  // History + lead update
  const finalScore = score;
  const delta = finalScore - prevScore;
  if (delta !== 0) {
    await LeadScoreHistory.create({
      organizationId: orgId,
      leadId: lead._id,
      score: finalScore,
      previousScore: prevScore,
      delta,
      reason: opts.reason ?? reason,
      source: opts.source ?? 'ai',
      eventType: opts.eventType,
      eventId: opts.eventId,
      factors: factors.slice(0, 8).map((f) => `${f.delta > 0 ? '+' : ''}${f.delta} ${f.label}`),
    }).catch((err) => console.error('[lead-scoring] history persist failed:', err));
  }

  await Lead.updateOne(
    { _id: lead._id },
    {
      $set: {
        score: finalScore,
        icpScore: icpMatch.score,
        engagementScore: deterministic.engagementScore,
        intentScore: deterministic.intentScore,
        grade: gradeFor(finalScore),
        intent,
        qualification,
        buyingStage,
        confidence: Math.round(confidence * 100) / 100,
        lastActivityAt: new Date(),
      },
    }
  ).exec();

  if (tagAdds.length) {
    await Lead.updateOne({ _id: lead._id }, { $addToSet: { tags: { $each: tagAdds } } }).exec();
  }
  if (tagRemoves.length) {
    await Lead.updateOne({ _id: lead._id }, { $pullAll: { tags: tagRemoves } }).exec();
  }

  // Real-time event
  leadEventBus.publish({
    type: 'score_changed',
    organizationId: orgId,
    leadId: String(lead._id),
    leadName: lead.name,
    score: finalScore,
    previousScore: prevScore,
    delta,
    intent,
    qualification,
    eventType: opts.eventType,
    reason,
    createdAt: new Date().toISOString(),
  });

  // Notifications on hot crossing
  if (finalScore >= 80 && prevScore < 80 && !notified) {
    notifyTeam(orgId, `Hot lead: ${lead.name}`, `Score crossed 80/100 — ${lead.company ?? 'no company'} is ready for immediate follow-up.`).catch(() => undefined);
  }

  // Score-based automations (fire-and-forget)
  if (delta !== 0) {
    triggerScoreWorkflows(orgId, lead, finalScore, prevScore, opts.eventType).catch(() => undefined);
  }

  return {
    leadId: String(lead._id),
    leadName: lead.name,
    score: finalScore,
    previousScore: prevScore,
    delta,
    grade: gradeFor(finalScore),
    intent,
    qualification,
    buyingStage,
    confidence: Math.round(confidence * 100) / 100,
    icpScore: icpMatch.score,
    factors,
    reason,
    recommendedAction,
    provider: ai.provider,
    model: ai.model,
    ruleEffects,
  };
}

/** Creates a lead and runs the initial score. Lead creation never blocks on AI. */
export async function createLeadAndScore(orgId: string, userId: string, input: Record<string, unknown>): Promise<{ leadId: string; outcome: ScoreOutcome }> {
  const lead = await Lead.create({
    organizationId: orgId,
    name: String(input.name),
    email: input.email ? String(input.email).toLowerCase() : undefined,
    company: input.company,
    jobTitle: input.jobTitle,
    industry: input.industry,
    companySize: input.companySize,
    location: input.location,
    website: input.website,
    revenue: input.revenue,
    source: String(input.source ?? 'manual'),
    leadType: input.leadType,
    phone: input.phone,
    whatsapp: input.whatsapp,
    tags: (input.tags as string[] | undefined) ?? [],
    customData: (input.customData as Record<string, unknown> | undefined) ?? {},
    metadata: (input.metadata as Record<string, unknown> | undefined) ?? {},
    firstSeenAt: new Date(),
    lastActivityAt: new Date(),
  });

  leadEventBus.publish({
    type: 'lead_created',
    organizationId: orgId,
    leadId: String(lead._id),
    leadName: lead.name,
    score: 0,
    data: { source: input.source ?? 'manual' },
    createdAt: new Date().toISOString(),
  });

  const outcome = await scoreLead(orgId, String(lead._id), { source: 'initial', userId });
  return { leadId: String(lead._id), outcome };
}

function estimateEventDelta(
  evt: { type: string; payload?: Record<string, unknown> | null },
  rules: Array<{ eventType?: string; action: RuleAction; trigger: string; conditions: Array<{ field: string; operator: string; value?: unknown }> }>
): { delta: number; reason: string; keywordFactors: ScoreFactor[] } {
  // Rule override first
  for (const rule of rules) {
    if (rule.trigger !== 'lead_event') continue;
    if (rule.eventType && rule.eventType !== evt.type) continue;
    if (rule.action.type === 'increase' || rule.action.type === 'decrease') {
      const applied = applyRuleAction(0, rule.action);
      return { delta: applied.delta, reason: applied.effect.replace('Rule: ', ''), keywordFactors: [] };
    }
  }

  const weight = EVENT_WEIGHTS[evt.type] ?? NEGATIVE_WEIGHTS[evt.type] ?? 0;
  const text = eventText(evt);
  const det = text ? detectIntentSignals(text) : { signals: [], boost: 0, factors: [] as ScoreFactor[] };
  const delta = weight + det.boost;
  const reason = det.signals[0] ?? evt.type.replace(/_/g, ' ');
  return { delta, reason, keywordFactors: det.factors };
}

/**
 * Enqueues a lead activity event and returns immediately. The event is
 * processed asynchronously (at-least-once) so lead creation and the HTTP
 * response never block on AI scoring.
 */
export async function enqueueLeadEvent(
  orgId: string,
  leadId: string,
  input: { type: string; channel?: string; payload?: Record<string, unknown>; text?: string; dedupeKey?: string }
): Promise<{ eventId: string; estimatedDelta: number; reason: string }> {
  const lead = await Lead.findOne({ _id: leadId, organizationId: orgId }).lean();
  if (!lead) throw ApiError.notFound('Lead not found');

  const payload = { ...(input.payload ?? {}) };
  if (input.text) payload.text = input.text;
  const dedupeKey =
    input.dedupeKey ?? crypto.createHash('sha256').update(`${orgId}|${leadId}|${input.type}|${input.text ?? ''}|${JSON.stringify(payload)}`).digest('hex');

  const exists = await LeadEvent.findOne({ dedupeKey }).lean();
  if (exists) return { eventId: String(exists._id), estimatedDelta: 0, reason: 'Duplicate event ignored' };

  const rules = await ScoringRule.find({ organizationId: orgId, enabled: true }).lean();
  const estimated = estimateEventDelta({ type: input.type, payload }, rules as never[]);

  const evt = await LeadEvent.create({
    organizationId: orgId,
    leadId: lead._id,
    type: input.type,
    channel: input.channel,
    payload,
    scoreDelta: 0,
    detectedIntent: estimated.keywordFactors.map((f) => f.label)[0],
    dedupeKey,
    processed: false,
  });

  // Async processing — never blocks the caller
  setImmediate(() => {
    processLeadEvent(orgId, String(evt._id)).catch((err) => {
      console.error('[lead-scoring] event processing failed:', err);
    });
  });

  return { eventId: String(evt._id), estimatedDelta: estimated.delta, reason: estimated.reason };
}

/** Processes a single enqueued event idempotently. */
export async function processLeadEvent(orgId: string, eventId: string): Promise<ScoreOutcome | null> {
  // Atomically claim the event to guarantee at-least-once, exactly-once-ish processing.
  const claimed = await LeadEvent.findOneAndUpdate(
    { _id: eventId, organizationId: orgId, processed: false },
    { $inc: { attemptCount: 1 } },
    { new: false }
  ).exec();
  if (!claimed) return null;

  const lead = await Lead.findOne({ _id: claimed.leadId, organizationId: orgId }).lean();
  if (!lead) {
    await LeadEvent.updateOne({ _id: eventId }, { $set: { processed: true, processedAt: new Date() } }).exec();
    return null;
  }

  const prevScore = lead.score ?? 0;
  const rules = await ScoringRule.find({ organizationId: orgId, enabled: true }).sort({ priority: -1 }).lean();
  const estimated = estimateEventDelta(claimed, rules as never[]);

  // Persist the event delta, then recompute the full intelligence state.
  await LeadEvent.updateOne({ _id: eventId }, { $set: { scoreDelta: estimated.delta, detectedIntent: estimated.keywordFactors[0]?.label } }).exec();
  const outcome = await scoreLead(orgId, String(lead._id), {
    source: 'event',
    eventId,
    eventType: claimed.type,
    reason: estimated.reason,
  });

  await LeadEvent.updateOne({ _id: eventId }, { $set: { processed: true, processedAt: new Date() } }).exec();

  leadEventBus.publish({
    type: 'event_processed',
    organizationId: orgId,
    leadId: String(lead._id),
    leadName: lead.name,
    score: outcome.score,
    previousScore: prevScore,
    delta: outcome.delta,
    eventType: claimed.type,
    reason: estimated.reason,
    data: { eventId },
    createdAt: new Date().toISOString(),
  });

  return outcome;
}

/** Manual re-score, e.g. from the Lead Details page. */
export async function rescoreLead(orgId: string, leadId: string, userId: string, reason?: string): Promise<ScoreOutcome> {
  return scoreLead(orgId, leadId, { source: 'manual', reason, userId });
}