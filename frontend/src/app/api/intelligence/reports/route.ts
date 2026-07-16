import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { generateCareerReport } from '@/services/intelligence/reportsEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') === 'monthly' ? 'monthly' : 'weekly';

    const report = await generateCareerReport(uid, type);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    logger.error('[Intelligence Reports API] Error compiling career report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
