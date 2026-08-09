import mongoose, { InferSchemaType, Schema } from 'mongoose';

const executionStepSchema = new Schema(
  {
    nodeId: { type: String },
    nodeKey: { type: String },
    label: { type: String },
    status: { type: String, enum: ['success', 'failed', 'running', 'waiting'] },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number, default: 0 },
    message: { type: String },
    error: { type: String },
    input: { type: Schema.Types.Mixed },
    output: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const executionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['success', 'failed', 'running', 'waiting'], default: 'waiting', index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number, default: 0 },
    trigger: { type: String },
    triggerData: { type: Schema.Types.Mixed, default: {} },
    steps: { type: [executionStepSchema], default: [] },
    error: { type: String },
    isTestRun: { type: Boolean, default: false },
  },
  { timestamps: true }
);

executionSchema.index({ organizationId: 1, createdAt: -1 });
executionSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
executionSchema.index({ workflowId: 1, createdAt: -1 });

export type Execution = InferSchemaType<typeof executionSchema>;
export type ExecutionStep = InferSchemaType<typeof executionStepSchema>;

export const Execution = mongoose.model('Execution', executionSchema);