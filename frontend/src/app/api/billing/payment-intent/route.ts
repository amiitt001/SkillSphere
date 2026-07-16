import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { calculateCheckoutPricing } from '@/services/billing/paymentGateway';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await req.json();
    const { planId, priceMonthly, couponCode } = body;

    if (!planId || typeof priceMonthly !== 'number') {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const checkoutDetails = calculateCheckoutPricing(planId, priceMonthly, couponCode);
    return NextResponse.json({ success: true, checkoutDetails });
  } catch (error) {
    logger.error('[Billing Payment Intent API] Error preparing charge info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
