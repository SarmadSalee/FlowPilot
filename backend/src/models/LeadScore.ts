import mongoose, { InferSchemaType, Schema } from 'mongoose';

/**
 * Latest AI score snapshot for a lead. One row per lead (1:1 with Lead),
 * rebuilt on every re-score so the intelligence panel always reflects
 * the most recent analysis.
 */
const scoreFactorSchema = new Schema(
  {
    label: { type: String, required: true },
    delta: { type: Number, default: 0 },
    kind: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
    source: { type: String, default: 'rule' },
  },
  { _id: false }
);

const scoreSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, unique: true, index: true },
    score: { type: Number, default: 0 },
    grade: { type: String, enum: ['A', 'B', 'C', 'D'], default: 'C' },
    intent: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    qualification: {
      type: String,
      enum: ['hot', 'warm', 'cold', 'qualified', 'unqualified'],
      default: 'cold',
    },
    buyingStage: {
      type: String,
      enum: ['awareness', 'interest', 'consideration', 'evaluation', 'decision', 'customer'],
      default: 'awareness',
    },
    confidence: { type: Number, default: 0 },
    icpMatch: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    buyingIntent: { type: Number, default: 0 },
    factors: { type: [scoreFactorSchema], default: [] },
    summary: { type: String },
    explanation: { type: String },
    recommendedAction: {
      title: { type: String },
      steps: { type: [String], default: [] },
      urgency: { type: String, default: 'normal' },
    },
    provider: { type: String, default: 'builtin' },
    model: { type: String, default: 'builtin' },
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

scoreSchema.index({ organizationId: 1, updatedAt: -1 });
scoreSchema.index({ organizationId: 1, score: -1 });

export type LeadScore = InferSchemaType<typeof scoreSchema>;
export type ScoreFactor = InferSchemaType<typeof scoreFactorSchema>;
export const LeadScore = mongoose.model('LeadScore', scoreSchema);