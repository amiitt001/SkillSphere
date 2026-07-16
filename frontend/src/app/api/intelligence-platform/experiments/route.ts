import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getAbExperiments, logExperimentConversion } from '@/services/intelligencePlatform/experimentationEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const experiments = await getAbExperiments();
    return NextResponse.json({ success: true, experiments });
  } catch (error) {
    logger.error('[Intelligence Platform Experiments API] Error listing A/B buckets:', error);
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
    const { experimentId } = body;

    if (!experimentId) {
      return NextResponse.json({ error: 'Missing experimentId' }, { status: 400 });
    }

    await logExperimentConversion(uid, experimentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Intelligence Platform Experiments API] Error conversion log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
