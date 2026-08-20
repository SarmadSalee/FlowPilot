import mongoose, { InferSchemaType, Schema } from 'mongoose';

const ruleConditionSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: {
      type: String,
      enum: ['gte', 'gt', 'lte', 'lt', 'eq', 'contains', 'exists', 'truthy', 'in'],
      default: 'gte',
    },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ruleActionSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    value: { type: Schema.Types.Mixed },
    target: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

/**
 * Configurable scoring rule. Rules can be created manually or compiled from
 * a natural-language instruction via the AI rule compiler.
 */
const scoringRuleSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    trigger: {
      type: String,
      enum: ['lead_created', 'lead_event', 'score_threshold', 'ai_analysis'],
      default: 'lead_event',
    },
    eventType: { type: String },
    conditions: { type: [ruleConditionSchema], default: [] },
    action: { type: ruleActionSchema, required: true },
    priority: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    source: { type: String, enum: ['builtin', 'user', 'ai'], default: 'user' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

scoringRuleSchema.index({ organizationId: 1, enabled: 1, priority: -1 });

export type ScoringRule = InferSchemaType<typeof scoringRuleSchema>;
export type RuleCondition = InferSchemaType<typeof ruleConditionSchema>;
export type RuleAction = InferSchemaType<typeof ruleActionSchema>;
export const ScoringRule = mongoose.model('ScoringRule', scoringRuleSchema);