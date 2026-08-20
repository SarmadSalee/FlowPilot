import { z } from 'zod';

const scoreField = z.number().min(0).max(100);

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  company: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
  companySize: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  website: z.string().max(300).optional(),
  revenue: z.number().nonnegative().optional(),
  source: z.string().max(100).optional(),
  leadType: z.string().max(100).optional(),
  phone: z.string().max(60).optional(),
  whatsapp: z.string().max(60).optional(),
  tags: z.array(z.string().max(60)).optional(),
  customData: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const addLeadEventSchema = z.object({
  type: z
    .string()
    .min(1, 'Event type is required')
    .max(100),
  channel: z.string().max(100).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  text: z.string().max(20_000).optional(),
  dedupeKey: z.string().max(200).optional(),
  occurredAt: z.string().datetime().optional(),
});

export const listLeadsQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.string().max(50).optional(),
  intent: z.enum(['low', 'medium', 'high']).optional(),
  qualification: z.string().max(50).optional(),
  minScore: scoreField.optional(),
  maxScore: scoreField.optional(),
  sort: z.string().max(50).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const compileRuleSchema = z.object({
  description: z.string().min(5, 'Describe the rule in plain English').max(2000),
});

export const scoringRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(200),
  description: z.string().max(2000).optional(),
  trigger: z.enum(['lead_created', 'lead_event', 'score_threshold', 'ai_analysis']),
  eventType: z.string().max(100).optional(),
  conditions: z
    .array(
      z.object({
        field: z.string().min(1),
        operator: z.enum(['gte', 'gt', 'lte', 'lt', 'eq', 'contains', 'exists', 'truthy', 'in']),
        value: z.unknown().optional(),
      })
    )
    .max(20)
    .optional(),
  action: z.object({
    type: z.enum([
      'increase',
      'decrease',
      'set',
      'set_intent',
      'set_qualification',
      'set_stage',
      'notify',
      'add_tag',
      'remove_tag',
      'trigger_workflow',
      'stop',
      'unsubscribe',
    ]),
    value: z.unknown().optional(),
    target: z.string().max(200).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  priority: z.number().int().min(-1000).max(1000).optional(),
  enabled: z.boolean().optional(),
});

export const icpProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  industries: z.array(z.string().max(100)).optional(),
  companySizeMin: z.number().nonnegative().optional(),
  companySizeMax: z.number().nonnegative().optional(),
  locations: z.array(z.string().max(100)).optional(),
  jobTitles: z.array(z.string().max(100)).optional(),
  minRevenue: z.number().nonnegative().optional(),
  minEmployees: z.number().nonnegative().optional(),
  technologies: z.array(z.string().max(100)).optional(),
  keywords: z.array(z.string().max(100)).optional(),
  customCriteria: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export const rescoreLeadSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type AddLeadEventInput = z.infer<typeof addLeadEventSchema>;
export type ScoringRuleInput = z.infer<typeof scoringRuleSchema>;
export type ICPProfileInput = z.infer<typeof icpProfileSchema>;