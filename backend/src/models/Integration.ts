import mongoose, { InferSchemaType, Schema } from 'mongoose';
import { constants } from '../config/constants';

const integrationSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, enum: constants.integrationCategories, required: true },
    description: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    isMock: { type: Boolean, default: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    configSchema: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

export type IntegrationDoc = InferSchemaType<typeof integrationSchema>;
export const Integration = mongoose.model('Integration', integrationSchema);