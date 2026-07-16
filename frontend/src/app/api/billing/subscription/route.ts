import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getUserSubscription, executeUpgradeCheckout } from '@/services/billing/billingEngine';
import { logComplianceAudit } from '@/services/enterprise/complianceEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const subscription = await getUserSubscription(uid);
    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    logger.error('[Billing Subscription API] Error loading subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const body = await req.json();
    const { checkoutDetails } = body;

    if (!checkoutDetails || !checkoutDetails.planId) {
      return NextResponse.json({ error: 'Missing checkout details parameters' }, { status: 400 });
    }

    const subscription = await executeUpgradeCheckout(uid, checkoutDetails);
    
    // Log audit log
    await logComplianceAudit(uid, authResult.user?.email || 'User', `SaaS Checkout Upgrade to ${checkoutDetails.planId}`);

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    logger.error('[Billing Subscription API] Error executing checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
