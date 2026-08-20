import { ScoringRule, type RuleAction } from '../models/ScoringRule';
import { ApiError } from '../utils/ApiError';

export interface CompiledRule {
  name: string;
  description: string;
  trigger: 'lead_created' | 'lead_event' | 'score_threshold' | 'ai_analysis';
  eventType?: string;
  conditions: Array<{ field: string; operator: string; value: unknown }>;
  action: RuleAction;
  source: 'user' | 'ai' | 'builtin';
}

function eventTypeFor(text: string): string | undefined {
  const t = text.toLowerCase();
  if (/(reply|replied|responded)/.test(t) && /email|mail/.test(t)) return 'email_replied';
  if (/(reply|replied|responded)/.test(t) && /whatsapp|message/.test(t)) return 'whatsapp_replied';
  if (/(open|opens|opened)/.test(t) && /email|mail/.test(t)) return 'email_opened';
  if (/(click|clicked|clicking)/.test(t)) return /pricing|price/.test(t) ? 'link_clicked' : 'link_clicked';
  if (/visit|visits|visited/.test(t)) return 'website_visited';
  if (/whatsapp/.test(t)) return /reply|replied/.test(t) ? 'whatsapp_replied' : 'whatsapp_received';
  if (/instagram/.test(t)) return 'instagram_interaction';
  if (/(messenger|facebook)/.test(t)) return 'messenger_interaction';
  if (/form/.test(t)) return 'form_submitted';
  if (/demo/.test(t)) return 'demo_requested';
  if (/meeting|book/.test(t)) return 'meeting_booked';
  if (/unsubscri/.test(t)) return 'unsubscribed';
  if (/spam/.test(t)) return 'spam';
  if (/invalid email|bounce/.test(t)) return 'invalid_email';
  return undefined;
}

/** Compiles a plain-English scoring instruction into a structured rule. */
export function compileRule(description: string): CompiledRule {
  const text = description.trim();
  const lower = text.toLowerCase();
  if (lower.length < 5) throw ApiError.badRequest('Describe the rule in plain English.');

  // Trigger detection
  let trigger: CompiledRule['trigger'] = 'lead_event';
  if (/(when a (new )?lead|new lead|lead (comes in|is created|captured|added))/.test(lower) && !/(replies|opens|visits|clicks|books|requests|asks|unsubscribes)/.test(lower)) {
    trigger = 'lead_created';
  } else if (/(score (is|reaches|hits|goes above|exceeds|rises above)|above \d+)/.test(lower)) {
    trigger = 'score_threshold';
  } else if (/(analy|ai) (analysis|detect|understand)/.test(lower)) {
    trigger = 'ai_analysis';
  }

  const eventType = eventTypeFor(text);

  // Conditions
  const conditions: Array<{ field: string; operator: string; value: unknown }> = [];
  const timesMatch = lower.match(/(more than|at least|over|above) (\d+)/);
  if (timesMatch) {
    const operator = timesMatch[1] === 'more than' ? 'gt' : 'gte';
    const value = Number(timesMatch[2]);
    if (/pricing page|price page/.test(lower)) conditions.push({ field: 'pricing_page_visits', operator, value });
    else if (/email|mail/.test(lower)) conditions.push({ field: 'email_opened', operator, value });
    else if (/website|site/.test(lower)) conditions.push({ field: 'website_visits', operator, value });
    else conditions.push({ field: 'engagement_count', operator, value });
  }
  if (/opened at least one email|opened (an|one) email/.test(lower)) {
    conditions.push({ field: 'email_opened', operator: 'gte', value: 1 });
  }
  if (/replied to (an|at least one|the) email/.test(lower)) {
    conditions.push({ field: 'email_replied', operator: 'gte', value: 1 });
  }

  // Action
  let action: RuleAction | null = null;
  const inc = lower.match(/increase (?:their |the lead'?s )?score by (\d+)/);
  const dec = lower.match(/decrease (?:their |the lead'?s )?score by (\d+)/);
  if (inc) {
    action = { type: 'increase', value: Number(inc[1]), metadata: {} };
  } else if (dec) {
    action = { type: 'decrease', value: Number(dec[1]), metadata: {} };
  } else if (/high intent|hot lead/.test(lower) && /(mark|set|label|flag)/.test(lower)) {
    action = { type: 'set_intent', value: /high intent/.test(lower) ? 'high' : 'hot', metadata: {} };
  } else if (/(mark|set).*(qualified|unqualified|hot|warm|cold)/.test(lower)) {
    const q = lower.match(/(qualified|unqualified|hot|warm|cold)/)![1];
    action = { type: 'set_qualification', value: q, metadata: {} };
  } else if (/notify (the |our |my )?(sales|marketing|support|growth) team/.test(lower)) {
    const team = lower.match(/(sales|marketing|support|growth)/)![1];
    action = { type: 'notify', target: `${team}_team`, metadata: {} };
  } else if (/notify/.test(lower) || /send (an? )?notification/.test(lower)) {
    action = { type: 'notify', target: 'team', metadata: {} };
  } else if (/(add|apply).*tag (\w+)/.test(lower)) {
    action = { type: 'add_tag', value: lower.match(/tag (\w+)/)![1], metadata: {} };
  } else if (/unsubscribe|stop (cold )?outreach/.test(lower)) {
    action = { type: 'unsubscribe', metadata: {} };
  } else if (/stop (the )?(automation|process|workflow)/.test(lower)) {
    action = { type: 'stop', metadata: {} };
  } else if (/(trigger|run|start).*workflow/.test(lower)) {
    const m = lower.match(/workflow ['"]?([\w-]+)['"]?/);
    action = { type: 'trigger_workflow', value: m?.[1] ?? '', metadata: {} };
  }

  if (!action) {
    // Fallback: default to a score increase so the rule is still actionable.
    action = { type: 'increase', value: 10, metadata: {} };
  }

  const name = text.split(/\s+/).slice(0, 7).join(' ').replace(/[.].*$/, '');
  return {
    name: name || 'Custom scoring rule',
    description: text,
    trigger,
    eventType,
    conditions,
    action: action as RuleAction,
    source: 'ai',
  };
}

export const leadRuleService = {
  async list(organizationId: string) {
    return ScoringRule.find({ organizationId }).sort({ enabled: -1, priority: -1, createdAt: -1 }).lean();
  },

  async getById(organizationId: string, ruleId: string) {
    const rule = await ScoringRule.findOne({ _id: ruleId, organizationId }).lean();
    if (!rule) throw ApiError.notFound('Scoring rule not found');
    return rule;
  },

  async create(organizationId: string, input: Record<string, unknown>) {
    const compiled = input.description
      ? compileRule(String(input.description))
      : null;
    const rule = await ScoringRule.create({
      organizationId,
      name: String(input.name ?? compiled?.name ?? 'Scoring rule'),
      description: String(input.description ?? compiled?.description ?? ''),
      trigger: (input.trigger ?? compiled?.trigger ?? 'lead_event') as never,
      eventType: input.eventType ?? compiled?.eventType,
      conditions: (input.conditions ?? compiled?.conditions ?? []) as never,
      action: (input.action ?? compiled?.action) as never,
      priority: input.priority ?? 0,
      enabled: input.enabled ?? true,
      source: input.source ?? compiled?.source ?? 'user',
      metadata: input.metadata ?? {},
    });
    return rule.toObject();
  },

  async update(organizationId: string, ruleId: string, input: Record<string, unknown>) {
    const allowed = ['name', 'description', 'trigger', 'eventType', 'conditions', 'action', 'priority', 'enabled'];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    const rule = await ScoringRule.findOneAndUpdate({ _id: ruleId, organizationId }, { $set: patch }, { new: true }).lean();
    if (!rule) throw ApiError.notFound('Scoring rule not found');
    return rule;
  },

  async remove(organizationId: string, ruleId: string) {
    const rule = await ScoringRule.findOneAndDelete({ _id: ruleId, organizationId }).lean();
    if (!rule) throw ApiError.notFound('Scoring rule not found');
    return rule;
  },

  compile: compileRule,
};