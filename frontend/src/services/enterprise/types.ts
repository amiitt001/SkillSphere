export type BillingPlanTier = 'free' | 'student-premium' | 'professional' | 'recruiter' | 'university' | 'enterprise';

export interface OrganizationDetails {
  id: string;
  name: string;
  plan: BillingPlanTier;
  seatsCapacity: number;
  seatsUsed: number;
  departments: string[];
}

export interface SubscriptionBilling {
  id: string;
  tier: BillingPlanTier;
  amountUsd: number;
  status: 'active' | 'past_due' | 'canceled';
  cycleEndsAt: string;
  invoices: Array<{ id: string; amount: number; date: string; paid: boolean }>;
}

export interface DeveloperApiKey {
  id: string;
  token: string;
  description: string;
  rateLimitLimit: number;
  rateLimitUsed: number;
  createdAt: string;
}

export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  category: 'tools' | 'resume' | 'prompts' | 'assessments' | 'interviews' | 'learning';
  version: string;
  author: string;
  downloads: number;
  rating: number;
  installed: boolean;
}

export interface ComplianceAuditLog {
  id: string;
  actor: string;
  action: string; // e.g. "api_key_generated", "gdpr_data_exported", "plan_upgraded"
  ipAddress: string;
  timestamp: string;
}
