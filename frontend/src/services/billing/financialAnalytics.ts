import type { BusinessFinancials } from './types';

const MOCK_FINANCIALS: BusinessFinancials = {
  mrr: 14250, // $14,250 monthly recurring revenue
  arr: 171000,
  churnRatePct: 2.4, // 2.4% churn rate
  planDistribution: {
    free: 240,
    pro: 110,
    recruiter: 18,
    university: 6,
    enterprise: 3
  },
  totalAiCostUsd: 184.20,
  profitabilityPct: 78
};

/**
 * Retrieves aggregate platform SaaS metrics.
 */
export async function getBusinessFinancials(): Promise<BusinessFinancials> {
  return MOCK_FINANCIALS;
}
