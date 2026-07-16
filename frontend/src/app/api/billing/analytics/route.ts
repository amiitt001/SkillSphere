import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getBusinessFinancials } from '@/services/billing/financialAnalytics';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const financials = await getBusinessFinancials();
    return NextResponse.json({ success: true, financials });
  } catch (error) {
    logger.error('[Billing Analytics API] Error collecting SaaS metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
