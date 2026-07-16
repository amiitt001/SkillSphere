export type SubscriptionPlanId = 'free' | 'pro' | 'recruiter' | 'university' | 'enterprise';

export interface UserSubscription {
  uid: string;
  planId: SubscriptionPlanId;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  paymentProvider: 'stripe' | 'razorpay' | 'paddle' | 'mock';
  cycleEndsAt: string;
  amountPaidUsd: number;
}

export interface UsageQuotaItem {
  used: number;
  limit: number;
}

export interface UsageQuotas {
  aiRequests: UsageQuotaItem;
  resumeScans: UsageQuotaItem;
  mockInterviews: UsageQuotaItem;
  jobApplications: UsageQuotaItem;
}

export interface BillingInvoice {
  id: string;
  amount: number;
  tax: number;
  discount: number;
  paid: boolean;
  date: string;
  description: string;
}

export interface BusinessFinancials {
  mrr: number;
  arr: number;
  churnRatePct: number;
  planDistribution: Record<SubscriptionPlanId, number>;
  totalAiCostUsd: number;
  profitabilityPct: number;
}
