import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { trackCareerHealth } from '@/services/intelligence/monitoringEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const health = await trackCareerHealth(uid);
    return NextResponse.json({ success: true, health });
  } catch (error) {
    logger.error('[Intelligence Health API] Error evaluating health metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
