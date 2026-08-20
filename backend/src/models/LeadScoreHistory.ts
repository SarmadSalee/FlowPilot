import mongoose, { InferSchemaType, Schema } from 'mongoose';

/**
 * Append-only ledger of every score change for a lead.
 * Powers the "Why did my score change" timeline.
 */
const scoreHistorySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    score: { type: Number, required: true },
    previousScore: { type: Number, required: true },
    delta: { type: Number, required: true },
    reason: { type: String },
    source: {
      type: String,
      enum: ['initial', 'event', 'keyword', 'ai', 'rule', 'manual', 'icp'],
      default: 'manual',
    },
    eventType: { type: String },
    eventId: { type: Schema.Types.ObjectId, ref: 'LeadEvent' },
    factors: { type: [String], default: [] },
  },
  { timestamps: true }
);

scoreHistorySchema.index({ organizationId: 1, leadId: 1, createdAt: -1 });

export type LeadScoreHistory = InferSchemaType<typeof scoreHistorySchema>;
export const LeadScoreHistory = mongoose.model('LeadScoreHistory', scoreHistorySchema);