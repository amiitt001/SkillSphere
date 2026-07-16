import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserSubscription, BillingInvoice, SubscriptionPlanId } from './types';
import type { CheckoutSessionDetails } from './paymentGateway';

const DEFAULT_SUB: UserSubscription = {
  uid: 'default',
  planId: 'free',
  status: 'active',
  paymentProvider: 'mock',
  cycleEndsAt: new Date(Date.now() + 2592000000).toISOString(),
  amountPaidUsd: 0
};

/**
 * Retrieves the user's active billing subscription configuration.
 */
export async function getUserSubscription(uid: string): Promise<UserSubscription> {
  try {
    const subRef = doc(db, 'users', uid, 'billing', 'subscription');
    const snap = await getDoc(subRef);
    if (snap.exists()) {
      return snap.data() as UserSubscription;
    }
  } catch (error) {
    console.error('[Billing Engine] Error fetching subscription details:', error);
  }
  return { ...DEFAULT_SUB, uid };
}

/**
 * Loads recent billing transaction invoices for a user.
 */
export async function getUserInvoices(uid: string): Promise<BillingInvoice[]> {
  try {
    const querySnap = await getDocs(collection(db, 'users', uid, 'invoices'));
    const list = querySnap.docs.map(doc => doc.data() as BillingInvoice);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('[Billing Engine] Error loading invoice history:', error);
    return [];
  }
}

/**
 * Executes a subscription upgrade/checkout transaction, saving the billing invoice in Firestore.
 */
export async function executeUpgradeCheckout(
  uid: string,
  checkout: CheckoutSessionDetails
): Promise<UserSubscription> {
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Create Invoice entry
  const invoice: BillingInvoice = {
    id: invoiceId,
    amount: checkout.total,
    tax: checkout.tax,
    discount: checkout.discount,
    paid: true,
    date: new Date().toISOString(),
    description: `SkillSphere SaaS Plan Upgrade: ${checkout.planId.toUpperCase()} subscription`
  };

  // Create User Subscription entry
  const subscription: UserSubscription = {
    uid,
    planId: checkout.planId as SubscriptionPlanId,
    status: 'active',
    paymentProvider: checkout.provider,
    cycleEndsAt: new Date(Date.now() + 2592000000).toISOString(), // 30 days
    amountPaidUsd: checkout.total
  };

  try {
    // Write Invoice log
    await setDoc(doc(db, 'users', uid, 'invoices', invoiceId), {
      ...invoice,
      serverTime: serverTimestamp()
    });

    // Write Subscription configurations
    await setDoc(doc(db, 'users', uid, 'billing', 'subscription'), {
      ...subscription,
      serverTime: serverTimestamp()
    });
  } catch (error) {
    console.error('[Billing Engine] Error saving checkout transaction logs:', error);
  }

  return subscription;
}
