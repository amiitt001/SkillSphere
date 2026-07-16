import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { executeGlobalSearch } from '@/services/enterprise/searchEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q') || '';

    const results = await executeGlobalSearch(q);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    logger.error('[Enterprise Search API] Error querying registry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
