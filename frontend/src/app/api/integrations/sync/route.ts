import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { executeIntegrationSync } from '@/services/integrations/syncEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const logs = await executeIntegrationSync(uid);
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    logger.error('[Integrations Sync API] Error executing sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
