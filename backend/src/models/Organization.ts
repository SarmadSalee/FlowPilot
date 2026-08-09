import mongoose, { InferSchemaType, Schema } from 'mongoose';

const orgMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
    invitedAt: { type: Date, default: Date.now },
    joinedAt: { type: Date },
  },
  { _id: false }
);

const inviteSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
    invitedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const integrationConnectionSchema = new Schema(
  {
    integrationKey: { type: String, required: true },
    status: { type: String, enum: ['connected', 'disconnected'], default: 'disconnected' },
    connectedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
    website: { type: String, trim: true },
    industry: { type: String, trim: true },
    members: { type: [orgMemberSchema], default: [] },
    invites: { type: [inviteSchema], default: [] },
    connectedIntegrations: { type: [integrationConnectionSchema], default: [] },
  },
  { timestamps: true }
);

organizationSchema.index({ 'members.userId': 1 });

export type Organization = InferSchemaType<typeof organizationSchema>;
export type OrgMember = InferSchemaType<typeof orgMemberSchema>;
export type OrgInvite = InferSchemaType<typeof inviteSchema>;

export const Organization = mongoose.model('Organization', organizationSchema);