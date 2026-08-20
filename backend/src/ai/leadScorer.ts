import { getProvider, type AIProviderName } from '.';
import type { Lead } from '../models/Lead';
import { LeadEvent } from '../models/LeadEvent';
import type { ICPProfile } from '../models/ICPProfile';

export interface ScoreFactor {
  label: string;
  delta: number;
  kind: 'positive' | 'negative' | 'neutral';
  source: 'event' | 'keyword' | 'ai' | 'rule' | 'icp' | 'info';
}

export interface DeterministicScoreResult {
  score: number;
  icpScore: number;
  engagementScore: number;
  intentScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  intent: 'low' | 'medium' | 'high';
  qualification: 'hot' | 'warm' | 'cold' | 'qualified' | 'unqualified';
  buyingStage: 'awareness' | 'interest' | 'consideration' | 'evaluation' | 'decision' | 'customer';
  factors: ScoreFactor[];
  detectedSignals: string[];
}

export interface AiAnalysisResult {
  ok: boolean;
  score?: number;
  grade?: DeterministicScoreResult['grade'];
  intent?: DeterministicScoreResult['intent'];
  qualification?: DeterministicScoreResult['qualification'];
  buyingStage?: DeterministicScoreResult['buyingStage'];
  confidence?: number;
  reason?: string;
  recommendedAction?: string;
  recommendedSteps?: string[];
  positiveFactors?: string[];
  negativeFactors?: string[];
  provider: string;
  model: string;
}

/** Base point weight for each engagement event type. */
export const EVENT_WEIGHTS: Record<string, number> = {
  email_opened: 5,
  email_clicked: 10,
  email_replied: 18,
  link_clicked: 8,
  website_visited: 7,
  whatsapp_received: 6,
  whatsapp_replied: 14,
  instagram_interaction: 6,
  messenger_interaction: 7,
  form_submitted: 12,
  demo_requested: 20,
  meeting_booked: 24,
};

/** Penalties applied for negative / disqualifying signals. */
export const NEGATIVE_WEIGHTS: Record<string, number> = {
  invalid_email: -10,
  unsubscribed: -30,
  spam: -25,
  student_jobseeker: -20,
  competitor: -15,
  out_of_market: -15,
  not_interested: -20,
  no_engagement: -5,
};

/** Keywords the engine scans message bodies for to detect buying intent. */
const INTENT_KEYWORDS: Array<{ pattern: RegExp; label: string; delta: number }> = [
  { pattern: /\b(pricing|how much|price|quote|proposal|cost)\b/i, label: 'Asked about pricing', delta: 15 },
  { pattern: /\b(demo|see it (in )?action|walkthrough|show me)\b/i, label: 'Requested demo', delta: 12 },
  { pattern: /\b(implement|implementation|integrat|set up|deploy|roll ?out)\b/i, label: 'Asked about implementation', delta: 12 },
  { pattern: /\b(feature|capabil|does it support|supports)\b/i, label: 'Asked about features', delta: 8 },
  { pattern: /\b(timeline|how long|eta|by when)\b/i, label: 'Asked about timeline', delta: 8 },
  { pattern: /\b(available|availability|when can we start)\b/i, label: 'Asked about availability', delta: 8 },
  { pattern: /\b(buy|purchase|ready to go|let'?s (get )?going|sign up|commit)\b/i, label: 'Strong buying intent', delta: 20 },
  { pattern: /\b(compare|vs|versus|alternative|competitor)\b/i, label: 'Comparing competitors', delta: 5 },
  { pattern: /\b(contract|agreement|paperwork|proposal)\b/i, label: 'Requesting proposal', delta: 15 },
  { pattern: /\b(not interested|no thanks|stop|don'?t contact)\b/i, label: 'Explicitly not interested', delta: -20 },
];

export function detectIntentSignals(text: string): { signals: string[]; boost: number; factors: ScoreFactor[] } {
  const signals: string[] = [];
  const factors: ScoreFactor[] = [];
  let boost = 0;
  for (const k of INTENT_KEYWORDS) {
    if (k.pattern.test(text)) {
      signals.push(k.label);
      boost += k.delta;
      factors.push({ label: k.label, delta: k.delta, kind: k.delta >= 0 ? 'positive' : 'negative', source: 'keyword' });
    }
  }
  return { signals, boost, factors };
}

export function gradeFor(score: number): DeterministicScoreResult['grade'] {
  if (score >= 90) return 'A';
  if (score >= 70) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

export function qualificationFor(score: number): DeterministicScoreResult['qualification'] {
  if (score >= 90) return 'hot';
  if (score >= 70) return 'warm';
  if (score >= 40) return 'qualified';
  if (score >= 20) return 'cold';
  return 'unqualified';
}

export function intentFor(score: number): DeterministicScoreResult['intent'] {
  if (score >= 70) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

export function stageFor(score: number): DeterministicScoreResult['buyingStage'] {
  if (score >= 85) return 'decision';
  if (score >= 70) return 'evaluation';
  if (score >= 50) return 'consideration';
  if (score >= 30) return 'interest';
  return 'awareness';
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

function companySizeToNumber(size?: string): number | undefined {
  if (!size) return undefined;
  const m = size.match(/\d+/g);
  if (!m) return undefined;
  return Number(m[m.length - 1]);
}

/**
 * Deterministic ICP matching. Produces a 0-100 score and a list of matched
 * criteria — entirely separate from the engagement/intent score.
 */
export function matchIcp(
  lead: Pick<Lead, 'industry' | 'companySize' | 'location' | 'jobTitle' | 'revenue' | 'website' | 'company'>,
  icp?: Pick<ICPProfile, 'industries' | 'companySizeMin' | 'companySizeMax' | 'locations' | 'jobTitles' | 'minRevenue' | 'keywords'> | null
): { score: number; matched: string[] } {
  if (!icp) return { score: 50, matched: [] };
  const matched: string[] = [];
  let hits = 0;
  let total = 0;

  if (icp.industries?.length) {
    total += 1;
    if (lead.industry && icp.industries.some((i) => i.toLowerCase() === lead.industry!.toLowerCase())) {
      hits += 1;
      matched.push(`Industry matches ICP (${lead.industry})`);
    }
  }

  if (icp.companySizeMin != null || icp.companySizeMax != null) {
    total += 1;
    const size = companySizeToNumber(lead.companySize ?? undefined);
    const within =
      size != null &&
      (icp.companySizeMin == null || size >= icp.companySizeMin) &&
      (icp.companySizeMax == null || size <= icp.companySizeMax);
    if (within) {
      hits += 1;
      matched.push(`Company size fits ICP (${lead.companySize})`);
    }
  }

  if (icp.locations?.length) {
    total += 1;
    if (lead.location && icp.locations.some((l) => l.toLowerCase() === lead.location!.toLowerCase())) {
      hits += 1;
      matched.push(`Location matches ICP (${lead.location})`);
    }
  }

  if (icp.jobTitles?.length) {
    total += 1;
    if (lead.jobTitle && icp.jobTitles.some((t) => lead.jobTitle!.toLowerCase().includes(t.toLowerCase()))) {
      hits += 1;
      matched.push(`Role matches ICP (${lead.jobTitle})`);
    }
  }

  if (icp.minRevenue != null) {
    total += 1;
    if (lead.revenue != null && lead.revenue >= icp.minRevenue) {
      hits += 1;
      matched.push(`Revenue meets ICP threshold`);
    }
  }

  if (icp.keywords?.length) {
    total += 1;
    const haystack = `${lead.company ?? ''} ${lead.website ?? ''}`.toLowerCase();
    const hit = icp.keywords.some((k) => haystack.includes(k.toLowerCase()));
    if (hit) {
      hits += 1;
      matched.push(`Keyword signal matches ICP`);
    }
  }

  const score = total === 0 ? 50 : Math.round((hits / total) * 100);
  return { score, matched };
}

/**
 * Computes the deterministic score from lead info, engagement events and
 * detected intent signals. This is the reliable fallback that always works,
 * even when the AI provider is unavailable.
 */
export function computeDeterministicScore(
  lead: Pick<Lead, 'name' | 'company' | 'jobTitle' | 'email' | 'source'>,
  events: Array<Pick<LeadEvent, 'type' | 'payload' | 'createdAt'>>,
  icp?: Pick<ICPProfile, 'industries' | 'companySizeMin' | 'companySizeMax' | 'locations' | 'jobTitles' | 'minRevenue' | 'keywords'> | null
): DeterministicScoreResult {
  const factors: ScoreFactor[] = [];
  const detectedSignals: string[] = [];

  // Lead information baseline
  let score = 0;
  if (lead.company) {
    score += 6;
    factors.push({ label: 'Company provided', delta: 6, kind: 'positive', source: 'info' });
  }
  if (lead.jobTitle) {
    score += 4;
    factors.push({ label: 'Role provided', delta: 4, kind: 'positive', source: 'info' });
  }
  if (lead.email) {
    score += 3;
    factors.push({ label: 'Email on file', delta: 3, kind: 'positive', source: 'info' });
  }

  // ICP baseline
  const icpMatch = matchIcp(lead, icp);
  const icpContribution = Math.round(icpMatch.score * 0.1);
  score += icpContribution;
  if (icpContribution > 0) {
    factors.push({ label: `ICP fit baseline (+${icpMatch.score}%)`, delta: icpContribution, kind: 'positive', source: 'icp' });
  }

  // Engagement events (recency-weighted: the last 7 days count full, older counts half)
  let engagementScore = 0;
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  for (const evt of events) {
    const weight = EVENT_WEIGHTS[evt.type];
    if (weight === undefined) continue;
    const age = now - new Date(evt.createdAt).getTime();
    const recency = age <= 7 * DAY ? 1 : age <= 30 * DAY ? 0.5 : 0.2;
    const delta = Math.round(weight * recency);
    engagementScore += delta;
    score += delta;
    factors.push({ label: evt.type.replace(/_/g, ' '), delta, kind: 'positive', source: 'event' });

    // Scan payload text (e.g. email/WhatsApp message body) for intent signals
    const text = [evt.payload?.text, evt.payload?.body, evt.payload?.message, evt.payload?.subject]
      .filter(Boolean)
      .join(' ');
    if (text) {
      const det = detectIntentSignals(text);
      for (const f of det.factors) {
        score += f.delta;
        factors.push(f);
      }
      detectedSignals.push(...det.signals);
    }
  }

  // Negative signals
  let negativeScore = 0;
  for (const evt of events) {
    const penalty = NEGATIVE_WEIGHTS[evt.type];
    if (penalty === undefined) continue;
    negativeScore += penalty;
    score += penalty;
    factors.push({ label: evt.type.replace(/_/g, ' '), delta: penalty, kind: 'negative', source: 'event' });
  }

  const final = clamp(score);
  return {
    score: final,
    icpScore: icpMatch.score,
    engagementScore: clamp(engagementScore),
    intentScore: clamp(engagementScore + icpContribution),
    grade: gradeFor(final),
    intent: intentFor(final),
    qualification: qualificationFor(final),
    buyingStage: stageFor(final),
    factors,
    detectedSignals,
  };
}

/**
 * Runs a structured AI analysis over the lead. Returns a normalized result;
 * never throws — on provider failure it reports ok:false so the caller can
 * fall back to the deterministic score.
 */
export async function analyzeLeadWithAi(input: {
  lead: Pick<Lead, 'name' | 'company' | 'jobTitle' | 'industry' | 'companySize' | 'location' | 'source'>;
  currentScore: number;
  events: Array<Pick<LeadEvent, 'type' | 'payload' | 'createdAt'>>;
  icpMatch: { score: number; matched: string[] };
  provider?: AIProviderName | 'auto';
  simulate?: boolean;
}): Promise<AiAnalysisResult> {
  const recent = input.events
    .slice(-8)
    .map((e) => {
      const text = [e.payload?.text, e.payload?.body, e.payload?.message, e.payload?.subject]
        .filter(Boolean)
        .join(' ');
      return `${e.type}${text ? ` — "${String(text).slice(0, 160)}"` : ''}`;
    })
    .join('\n');

  const system =
    'You are the FlowPilot lead intelligence engine. Given a lead profile and recent activity, ' +
    'classify the lead. Reply with ONLY a JSON object matching exactly this shape:\n' +
    '{"score": <0-100 integer>, "intent": "low"|"medium"|"high", "qualification": "hot"|"warm"|"cold"|"qualified"|"unqualified", ' +
    '"buying_stage": "awareness"|"interest"|"consideration"|"evaluation"|"decision"|"customer", ' +
    '"confidence": <0-1 number>, "reason": "<one sentence>", "recommended_action": "<short imperative>", ' +
    '"recommended_steps": ["<step>", ...], "positive_factors": ["..."], "negative_factors": ["..."]}';

  const prompt = `Lead profile:\n${JSON.stringify(input.lead, null, 2)}\n\nICP match: ${input.icpMatch.score}/100 (${input.icpMatch.matched.join(', ') || 'none'})\n\nCurrent deterministic score: ${input.currentScore}/100\n\nRecent activity:\n${recent || 'No activity yet.'}\n\nReturn the JSON analysis.`;

  const provider = getProvider(input.provider ?? 'auto');
  try {
    const res = await provider.complete({
      messages: [{ role: 'user', content: prompt }],
      system,
      temperature: 0.2,
      maxTokens: 700,
    });

    const parsed = parseAiJson(res.text);
    if (!parsed) {
      return { ok: false, provider: res.provider, model: res.model };
    }
    return normalizeAiResult(parsed, res.provider, res.model);
  } catch {
    return { ok: false, provider: provider.name, model: 'unknown' };
  }
}

export function parseAiJson(text: string): Record<string, unknown> | null {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last <= first) return null;
  try {
    const obj = JSON.parse(text.slice(first, last + 1)) as Record<string, unknown>;
    return obj && typeof obj === 'object' ? obj : null;
  } catch {
    return null;
  }
}

export function normalizeAiResult(
  raw: Record<string, unknown>,
  provider: string,
  model: string
): AiAnalysisResult {
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && !isNaN(v) ? v : typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : fallback;

  const score = Math.max(0, Math.min(100, Math.round(num(raw.score, 0))));
  const confidence = Math.max(0, Math.min(1, num(raw.confidence, 0)));
  const intent = ['low', 'medium', 'high'].includes(String(raw.intent))
    ? (String(raw.intent) as DeterministicScoreResult['intent'])
    : intentFor(score);
  const qualification = ['hot', 'warm', 'cold', 'qualified', 'unqualified'].includes(String(raw.qualification))
    ? (String(raw.qualification) as DeterministicScoreResult['qualification'])
    : qualificationFor(score);
  const buyingStage = ['awareness', 'interest', 'consideration', 'evaluation', 'decision', 'customer'].includes(
    String(raw.buying_stage)
  )
    ? (String(raw.buying_stage) as DeterministicScoreResult['buyingStage'])
    : stageFor(score);
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

  return {
    ok: true,
    score,
    grade: gradeFor(score),
    intent,
    qualification,
    buyingStage,
    confidence,
    reason: String(raw.reason ?? '').slice(0, 400),
    recommendedAction: String(raw.recommended_action ?? '').slice(0, 200),
    recommendedSteps: arr(raw.recommended_steps).slice(0, 6),
    positiveFactors: arr(raw.positive_factors).slice(0, 8),
    negativeFactors: arr(raw.negative_factors).slice(0, 8),
    provider,
    model,
  };
}

/** Human-readable recommended action for a lead, used when AI is unavailable. */
export function fallbackRecommendation(
  score: number,
  qualification: DeterministicScoreResult['qualification']
): { title: string; steps: string[]; urgency: string } {
  if (score >= 80 || qualification === 'hot') {
    return {
      title: 'Contact immediately',
      steps: ['Send personalized proposal', 'Offer a demo', 'Follow up within 15 minutes'],
      urgency: 'high',
    };
  }
  if (score >= 60 || qualification === 'warm') {
    return {
      title: 'Send follow-up',
      steps: ['Send pricing details', 'Schedule a discovery call', 'Add to priority pipeline'],
      urgency: 'medium',
    };
  }
  if (score >= 40) {
    return {
      title: 'Add to nurture campaign',
      steps: ['Add to nurture sequence', 'Send educational content', 'Re-engage in 7 days'],
      urgency: 'low',
    };
  }
  return {
    title: 'Keep monitoring',
    steps: ['Add to nurture campaign', 'Re-score on next engagement'],
    urgency: 'low',
  };
}

/** Simple scoring rule matching: evaluates a rule's conditions against an event/lead context. */
export function conditionsMatch(
  conditions: Array<{ field: string; operator: string; value?: unknown }>,
  ctx: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => {
    const actual = ctx[c.field];
    switch (c.operator) {
      case 'gte':
        return Number(actual) >= Number(c.value);
      case 'gt':
        return Number(actual) > Number(c.value);
      case 'lte':
        return Number(actual) <= Number(c.value);
      case 'lt':
        return Number(actual) < Number(c.value);
      case 'eq':
        return String(actual) === String(c.value);
      case 'contains':
        return String(actual ?? '').toLowerCase().includes(String(c.value ?? '').toLowerCase());
      case 'exists':
        return actual !== undefined && actual !== null && String(actual) !== '';
      case 'truthy':
        return Boolean(actual);
      case 'in':
        return Array.isArray(c.value) && c.value.includes(actual);
      default:
        return false;
    }
  });
}

/** Async queue that lets the scorer process events without blocking lead creation. */
export async function retryFailedLeadEvents(): Promise<void> {
  const stale = await LeadEvent.find({
    processed: false,
    attemptCount: { $lt: 3 },
    processedAt: { $exists: false },
    createdAt: { $lt: new Date(Date.now() - 60_000) },
  })
    .limit(50)
    .exec();
  for (const evt of stale) {
    const { processLeadEvent } = await import('../services/leadScoringService.js');
    try {
      await processLeadEvent(String(evt.organizationId), String(evt._id));
    } catch (err) {
      console.error('[lead-scoring] retry failed:', err);
    }
  }
}