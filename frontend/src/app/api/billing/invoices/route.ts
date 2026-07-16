import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getUserInvoices } from '@/services/billing/billingEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const invoices = await getUserInvoices(uid);
    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    logger.error('[Billing Invoices API] Error loading payment logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
