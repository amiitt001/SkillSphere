import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getAutonomousCoachBrief } from '@/services/intelligence/autonomousCoach';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const brief = await getAutonomousCoachBrief(uid);
    return NextResponse.json({ success: true, brief });
  } catch (error) {
    logger.error('[Intelligence Coach API] Error loading autonomous coaching brief:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
