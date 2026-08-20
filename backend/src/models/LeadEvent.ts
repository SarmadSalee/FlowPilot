import mongoose, { InferSchemaType, Schema } from 'mongoose';

/**
 * Incoming lead activity stream. Every event is persisted here,
 * processed at-least-once (idempotent via dedupeKey), and emitted
 * over the real-time lead feed.
 */
const leadEventSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    type: {
      type: String,
      required: true,
    },
    channel: { type: String },
    payload: { type: Schema.Types.Mixed, default: {} },
    scoreDelta: { type: Number, default: 0 },
    detectedIntent: { type: String },
    dedupeKey: { type: String },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date },
    attemptCount: { type: Number, default: 0 },
    lastError: { type: String },
  },
  { timestamps: true }
);

leadEventSchema.index({ organizationId: 1, processed: 1, createdAt: -1 });
leadEventSchema.index({ organizationId: 1, leadId: 1, createdAt: -1 });
leadEventSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export type LeadEvent = InferSchemaType<typeof leadEventSchema>;
export const LeadEvent = mongoose.model('LeadEvent', leadEventSchema);