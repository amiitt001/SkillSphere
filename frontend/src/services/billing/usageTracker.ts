import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UsageQuotas, SubscriptionPlanId } from './types';

export const PLAN_LIMITS: Record<SubscriptionPlanId, Record<string, number>> = {
  free: { aiRequests: 20, resumeScans: 3, mockInterviews: 2, jobApplications: 5 },
  pro: { aiRequests: 1000, resumeScans: 100, mockInterviews: 50, jobApplications: 200 },
  recruiter: { aiRequests: 5000, resumeScans: 500, mockInterviews: 200, jobApplications: 1000 },
  university: { aiRequests: 10000, resumeScans: 2000, mockInterviews: 1000, jobApplications: 5000 },
  enterprise: { aiRequests: 50000, resumeScans: 10000, mockInterviews: 5000, jobApplications: 25000 }
};

const DEFAULT_QUOTAS = {
  aiRequests: { used: 0, limit: 20 },
  resumeScans: { used: 0, limit: 3 },
  mockInterviews: { used: 0, limit: 2 },
  jobApplications: { used: 0, limit: 5 }
};

/**
 * Retrieves the user's active usage counts and limits based on their subscription tier.
 */
export async function getUserUsageQuotas(uid: string, planId: SubscriptionPlanId): Promise<UsageQuotas> {
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;

  try {
    const quotaRef = doc(db, 'users', uid, 'usage_quotas', 'current');
    const snap = await getDoc(quotaRef);
    
    if (snap.exists()) {
      const data = snap.data();
      return {
        aiRequests: { used: data.aiRequests || 0, limit: limits.aiRequests },
        resumeScans: { used: data.resumeScans || 0, limit: limits.resumeScans },
        mockInterviews: { used: data.mockInterviews || 0, limit: limits.mockInterviews },
        jobApplications: { used: data.jobApplications || 0, limit: limits.jobApplications }
      };
    }
  } catch (error) {
    console.error('[Usage Tracker] Error fetching quotas:', error);
  }

  return {
    aiRequests: { used: 0, limit: limits.aiRequests },
    resumeScans: { used: 0, limit: limits.resumeScans },
    mockInterviews: { used: 0, limit: limits.mockInterviews },
    jobApplications: { used: 0, limit: limits.jobApplications }
  };
}

/**
 * Increments a usage quota key. Returns false if the limit is exceeded.
 */
export async function incrementUsageQuota(
  uid: string,
  planId: SubscriptionPlanId,
  quotaKey: keyof UsageQuotas
): Promise<boolean> {
  const currentQuotas = await getUserUsageQuotas(uid, planId);
  const quota = currentQuotas[quotaKey];

  if (quota.used >= quota.limit) {
    return false; // Limit exceeded!
  }

  try {
    const quotaRef = doc(db, 'users', uid, 'usage_quotas', 'current');
    await setDoc(quotaRef, {
      [quotaKey]: quota.used + 1
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[Usage Tracker] Error incrementing quota:', error);
    return false;
  }
}
