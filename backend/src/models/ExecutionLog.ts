import mongoose, { InferSchemaType, Schema } from 'mongoose';

const executionLogSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    executionId: { type: Schema.Types.ObjectId, ref: 'Execution', required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

executionLogSchema.index({ executionId: 1, createdAt: 1 });

export type ExecutionLogDoc = InferSchemaType<typeof executionLogSchema>;
export const ExecutionLog = mongoose.model('ExecutionLog', executionLogSchema);