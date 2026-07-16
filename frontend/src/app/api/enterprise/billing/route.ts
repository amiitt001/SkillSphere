import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getUserBilling, updateBillingPlan } from '@/services/enterprise/billingEngine';
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
    const billing = await getUserBilling(uid);
    return NextResponse.json({ success: true, billing });
  } catch (error) {
    logger.error('[Enterprise Billing API] Error loading billing info:', error);
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
    const { tier } = body;

    if (!tier) {
      return NextResponse.json({ error: 'Missing tier plan target' }, { status: 400 });
    }

    const billing = await updateBillingPlan(uid, tier);
    
    // Log compliance audit
    await logComplianceAudit(uid, authResult.user?.email || 'User', `Upgrade Billing Plan to ${tier}`);

    return NextResponse.json({ success: true, billing });
  } catch (error) {
    logger.error('[Enterprise Billing API] Error updating plan tier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
