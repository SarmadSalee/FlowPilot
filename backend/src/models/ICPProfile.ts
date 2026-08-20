import mongoose, { InferSchemaType, Schema } from 'mongoose';

/**
 * Ideal Customer Profile. Used by the ICP matcher to produce an ICP match
 * score that is separate from the engagement/intent score.
 */
const icpProfileSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
    name: { type: String, default: 'Default ICP' },
    industries: { type: [String], default: [] },
    companySizeMin: { type: Number },
    companySizeMax: { type: Number },
    locations: { type: [String], default: [] },
    jobTitles: { type: [String], default: [] },
    minRevenue: { type: Number },
    minEmployees: { type: Number },
    technologies: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    customCriteria: { type: Schema.Types.Mixed, default: {} },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type ICPProfile = InferSchemaType<typeof icpProfileSchema>;
export const ICPProfile = mongoose.model('ICPProfile', icpProfileSchema);