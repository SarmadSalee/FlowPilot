import mongoose, { InferSchemaType, Schema } from 'mongoose';

const activityLogSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String },
    action: { type: String, required: true },
    resource: { type: String },
    message: { type: String },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

activityLogSchema.index({ organizationId: 1, createdAt: -1 });

export type ActivityLog = InferSchemaType<typeof activityLogSchema>;
export const ActivityLogModel = mongoose.model('ActivityLog', activityLogSchema);