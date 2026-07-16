import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { dispatchCareerEvent, getUserEvents } from '@/services/intelligence/eventEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const events = await getUserEvents(uid);
    return NextResponse.json({ success: true, events });
  } catch (error) {
    logger.error('[Intelligence Events API] Error loading event logs:', error);
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
    const { type, description, metadata } = body;

    if (!type || !description) {
      return NextResponse.json({ error: 'Missing type or description' }, { status: 400 });
    }

    const event = await dispatchCareerEvent(uid, type, description, metadata);
    return NextResponse.json({ success: true, event });
  } catch (error) {
    logger.error('[Intelligence Events API] Error dispatching event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
