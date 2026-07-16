import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getSyncLogs } from '@/services/integrations/syncEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const logs = await getSyncLogs(uid);
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    logger.error('[Integrations Logs API] Error loading sync logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
