import mongoose, { InferSchemaType, Schema } from 'mongoose';

const subscriptionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
    plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    status: { type: String, enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete'], default: 'active' },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    usedExecutions: { type: Number, default: 0 },
    paymentMethod: { type: String },
    isMock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type Subscription = InferSchemaType<typeof subscriptionSchema>;
export const SubscriptionModel = mongoose.model('Subscription', subscriptionSchema);