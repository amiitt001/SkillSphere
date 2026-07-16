import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { SubscriptionBilling, BillingPlanTier } from './types';

const DEFAULT_BILLING: SubscriptionBilling = {
  id: 'sub_default',
  tier: 'free',
  amountUsd: 0,
  status: 'active',
  cycleEndsAt: new Date(Date.now() + 2592000000).toISOString(),
  invoices: []
};

const PLAN_PRICING: Record<BillingPlanTier, number> = {
  free: 0,
  'student-premium': 9,
  professional: 29,
  recruiter: 99,
  university: 299,
  enterprise: 999
};

/**
 * Retrieves the billing details and subscription tier for a user.
 */
export async function getUserBilling(uid: string): Promise<SubscriptionBilling> {
  try {
    const billingRef = doc(db, 'users', uid, 'billing', 'subscription');
    const snap = await getDoc(billingRef);
    if (snap.exists()) {
      return snap.data() as SubscriptionBilling;
    }
  } catch (error) {
    console.error('[Billing Engine] Error loading subscription:', error);
  }
  return DEFAULT_BILLING;
}

/**
 * Upgrades or modifies the user plan tier and generates a new mock invoice log.
 */
export async function updateBillingPlan(uid: string, tier: BillingPlanTier): Promise<SubscriptionBilling> {
  const current = await getUserBilling(uid);
  const amount = PLAN_PRICING[tier];
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const newInvoices = [
    { id: invoiceId, amount, date: new Date().toISOString(), paid: true },
    ...(current.invoices || [])
  ];

  const updated: SubscriptionBilling = {
    id: current.id === 'sub_default' ? `sub_${Math.random().toString(36).substring(7)}` : current.id,
    tier,
    amountUsd: amount,
    status: 'active',
    cycleEndsAt: new Date(Date.now() + 2592000000).toISOString(),
    invoices: newInvoices
  };

  try {
    await setDoc(doc(db, 'users', uid, 'billing', 'subscription'), updated);
  } catch (error) {
    console.error('[Billing Engine] Error updating subscription plan:', error);
  }

  return updated;
}
