import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { logTelemetryEvent } from '@/services/intelligencePlatform/analyticsEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const body = await req.json();
    const { action, metadata } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    await logTelemetryEvent(uid, action, metadata);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Intelligence Platform Telemetry API] Error logging action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
