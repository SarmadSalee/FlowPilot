import mongoose, { InferSchemaType, Schema } from 'mongoose';

/**
 * Core lead record. Holds the current intelligence state for a lead.
 * The score/qualification fields are kept in sync by the lead scoring engine.
 */
const leadSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    company: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    industry: { type: String, trim: true },
    companySize: { type: String, trim: true },
    location: { type: String, trim: true },
    website: { type: String, trim: true },
    revenue: { type: Number },
    source: { type: String, trim: true, default: 'manual' },
    leadType: { type: String, trim: true },
    phone: { type: String, trim: true },
    whatsapp: { type: String, trim: true },

    // AI intelligence state (managed by the scoring engine)
    score: { type: Number, default: 0 },
    icpScore: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },
    intentScore: { type: Number, default: 0 },
    grade: { type: String, enum: ['A', 'B', 'C', 'D'], default: 'C' },
    intent: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
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

    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost', 'spam'],
      default: 'new',
    },
    tags: { type: [String], default: [] },
    customData: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed, default: {} },
    unsubscribed: { type: Boolean, default: false },
    firstSeenAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

leadSchema.index({ organizationId: 1, createdAt: -1 });
leadSchema.index({ organizationId: 1, score: -1 });
leadSchema.index({ organizationId: 1, status: 1 });
leadSchema.index({ organizationId: 1, email: 1 }, { unique: true, sparse: true });

export type Lead = InferSchemaType<typeof leadSchema>;
export const Lead = mongoose.model('Lead', leadSchema);