const PLAN_CREDIT_LIMITS: Record<string, number> = {
  free: 1000,
  pro: 30000,
  business: 120000,
};

export interface CreditsView {
  plan: string;
  planLimit: number;
  used: number;
  remaining: number;
}

export const Treasury = {
  limit(plan: string): number {
    return PLAN_CREDIT_LIMITS[plan] ?? PLAN_CREDIT_LIMITS.free;
  },
  credits(plan: string, usedTokens: number): CreditsView {
    const planLimit = Treasury.limit(plan);
    const used = Math.floor(usedTokens);
    return {
      plan,
      planLimit,
      used,
      remaining: Math.max(0, planLimit - used),
    };
  },
};