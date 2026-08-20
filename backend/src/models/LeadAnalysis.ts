import mongoose, { InferSchemaType, Schema } from 'mongoose';

/**
 * A single AI analysis run over a lead. Captures intent, qualification,
 * buying stage, confidence, and the recommended next action.
 * This is the source of truth for "why did the AI score this lead".
 */
const analysisSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    score: { type: Number, default: 0 },
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
    reasons: { type: [String], default: [] },
    summary: { type: String },
    recommendedAction: { type: String },
    recommendedSteps: { type: [String], default: [] },
    source: { type: String, default: 'ai' },
    provider: { type: String, default: 'builtin' },
    model: { type: String, default: 'builtin' },
    inputSnapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

analysisSchema.index({ organizationId: 1, leadId: 1, createdAt: -1 });

export type LeadAnalysis = InferSchemaType<typeof analysisSchema>;
export const LeadAnalysis = mongoose.model('LeadAnalysis', analysisSchema);