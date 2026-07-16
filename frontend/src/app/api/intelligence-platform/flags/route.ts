import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getFeatureFlags, saveFeatureFlag } from '@/services/intelligencePlatform/featureFlagEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const flags = await getFeatureFlags();
    return NextResponse.json({ success: true, flags });
  } catch (error) {
    logger.error('[Intelligence Platform Flags API] Error loading flags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await req.json();
    const { id, name, enabled, rolloutPercentage } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required flag parameters' }, { status: 400 });
    }

    const flag = { id, name, enabled, rolloutPercentage };
    await saveFeatureFlag(flag);

    return NextResponse.json({ success: true, flag });
  } catch (error) {
    logger.error('[Intelligence Platform Flags API] Error updating flag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
