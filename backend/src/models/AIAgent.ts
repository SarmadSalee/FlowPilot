import mongoose, { InferSchemaType, Schema } from 'mongoose';

const agentToolSchema = new Schema(
  {
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const agentSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300 },
    instructions: { type: String, required: true },
    model: { type: String, default: 'mock' },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    tools: { type: [agentToolSchema], default: [] },
    knowledge: { type: String },
    memory: { type: Boolean, default: false },
    executionLimit: { type: Number, default: 1000 },
    status: { type: String, enum: ['active', 'inactive', 'error'], default: 'inactive' },
    executions: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    tokenUsage: { type: Number, default: 0 },
    avgResponseMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

agentSchema.index({ organizationId: 1, createdAt: -1 });

export type Agent = InferSchemaType<typeof agentSchema>;
export type AgentTool = InferSchemaType<typeof agentToolSchema>;
export const Agent = mongoose.model('Agent', agentSchema);