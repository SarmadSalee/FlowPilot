import mongoose, { InferSchemaType, Schema } from 'mongoose';

const apiKeySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    keyHash: { type: String, required: true, index: true },
    prefix: { type: String, required: true },
    lastUsedAt: { type: Date },
    revokedAt: { type: Date },
    useCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

apiKeySchema.index({ organizationId: 1, createdAt: -1 });

export type ApiKey = InferSchemaType<typeof apiKeySchema>;
export const ApiKeyModel = mongoose.model('ApiKey', apiKeySchema);