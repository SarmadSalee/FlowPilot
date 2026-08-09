import mongoose, { InferSchemaType, Schema } from 'mongoose';

const templateNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['trigger', 'ai', 'action', 'condition', 'utility'], required: true },
    key: { type: String, required: true },
    label: { type: String, required: true },
    position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const templateEdgeSchema = new Schema(
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

const templateSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    icon: { type: String, default: 'workflow' },
    featured: { type: Boolean, default: false },
    steps: { type: [String], default: [] },
    nodes: { type: [templateNodeSchema], default: [] },
    edges: { type: [templateEdgeSchema], default: [] },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export type Template = InferSchemaType<typeof templateSchema>;
export const Template = mongoose.model('Template', templateSchema);