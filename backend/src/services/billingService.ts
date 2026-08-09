import { Organization } from '../models/Organization';
import { SubscriptionModel } from '../models/Subscription';
import { Execution } from '../models/WorkflowExecution';
import { ApiError } from '../utils/ApiError';
import { constants } from '../config/constants';

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    executionsPerMonth: constants.planLimits.free.executionsPerMonth,
    workflows: constants.planLimits.free.workflows,
    aiEnabled: false,
    teamSize: 1,
    highlights: ['5 workflows', '100 executions / month', 'Basic integrations', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    executionsPerMonth: constants.planLimits.pro.executionsPerMonth,
    workflows: 'unlimited',
    aiEnabled: true,
    teamSize: 10,
    highlights: ['Unlimited workflows', '10,000 executions/month', 'AI automation', 'Advanced analytics', 'Premium integrations'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 199,
    executionsPerMonth: constants.planLimits.business.executionsPerMonth,
    workflows: 'unlimited',
    aiEnabled: true,
    teamSize: 'unlimited',
    highlights: ['Unlimited workflows', '100,000 executions/month', 'Team collaboration', 'Priority support', 'Advanced AI'],
  },
];

export const billingService = {
  plans: PLANS,

  async current(organizationId: string) {
    const org = await Organization.findById(organizationId).lean();
    if (!org) throw ApiError.notFound('Organization not found');

    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const usage = await Execution.countDocuments({
      organizationId,
      createdAt: { $gte: periodStart },
    });

    const limits = constants.planLimits[org.plan as (typeof constants.planTiers)[number]];
    return {
      plan: org.plan,
      usageThisMonth: usage,
      executionLimit: limits.executionsPerMonth,
      workflowsLimit: limits.workflows,
      aiEnabled: limits.aiEnabled,
      teamSize: limits.teamSize,
      periodStart,
    };
  },

  async checkout(organizationId: string, plan: string) {
    const target = PLANS.find((p) => p.id === plan);
    if (!target) throw ApiError.badRequest('Invalid plan');
    if (target.price === 0) {
      // Free plan: switch plan directly (mock)
      await Organization.updateOne({ _id: organizationId }, { $set: { plan: 'free' } });
      return { plan: 'free', checkoutUrl: null, mock: true };
    }

    const isMock = !process.env.STRIPE_SECRET_KEY;
    // Mock checkout (no Stripe credentials).
    await Organization.updateOne({ _id: organizationId }, { $set: { plan: plan } });
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await SubscriptionModel.findOneAndUpdate(
      { organizationId },
      {
        plan,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        isMock,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    return {
      plan,
      checkoutUrl: isMock ? null : 'https://checkout.stripe.com/placeholder',
      mock: isMock,
      message: isMock
        ? 'Billing is running in demo mode with simulated checkout.'
        : 'Redirecting to Stripe Checkout.',
    };
  },

  async cancel(organizationId: string) {
    await Organization.updateOne({ _id: organizationId }, { $set: { plan: 'free' } });
    await SubscriptionModel.updateOne(
      { organizationId },
      { $set: { status: 'canceled' } }
    ).exec();
    return { plan: 'free', canceled: true };
  },
};