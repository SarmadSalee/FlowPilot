import mongoose, { InferSchemaType, Schema } from 'mongoose';

/**
 * Backend representation of a workflow graph node.
 * `id` maps to the React Flow node id; edges are stored on the Workflow.
 */
const workflowNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'trigger',
        'ai',
        'action',
        'condition',
        'utility',
      ],
      required: true,
    },
    key: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    enabled: { type: Boolean, default: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const workflowEdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    sourceHandle: { type: String },
    target: { type: String, required: true },
    targetHandle: { type: String },
    label: { type: String },
  },
  { _id: false }
);

const workflowSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
    isTemplate: { type: Boolean, default: false },
    nodes: { type: [workflowNodeSchema], default: [] },
    edges: { type: [workflowEdgeSchema], default: [] },
    lastRunAt: { type: Date },
    runCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

workflowSchema.index({ organizationId: 1, createdAt: -1 });
workflowSchema.index({ organizationId: 1, status: 1 });

export type Workflow = InferSchemaType<typeof workflowSchema>;
export type WorkflowNode = InferSchemaType<typeof workflowNodeSchema>;
export type WorkflowEdge = InferSchemaType<typeof workflowEdgeSchema>;

export const Workflow = mongoose.model('Workflow', workflowSchema);