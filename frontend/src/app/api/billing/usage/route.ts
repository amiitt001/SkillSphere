import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getUserSubscription } from '@/services/billing/billingEngine';
import { getUserUsageQuotas } from '@/services/billing/usageTracker';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const sub = await getUserSubscription(uid);
    const quotas = await getUserUsageQuotas(uid, sub.planId);

    return NextResponse.json({ success: true, quotas });
  } catch (error) {
    logger.error('[Billing Usage API] Error loading quotas metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
