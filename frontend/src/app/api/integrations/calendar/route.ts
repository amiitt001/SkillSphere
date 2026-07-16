import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getUserCalendarEvents, generateEventPrepChecklist } from '@/services/integrations/calendarIntelligence';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const events = await getUserCalendarEvents(uid);
    return NextResponse.json({ success: true, events });
  } catch (error) {
    logger.error('[Integrations Calendar API] Error listing calendar events:', error);
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
    const { event } = body;

    if (!event || !event.id) {
      return NextResponse.json({ error: 'Missing event body parameters' }, { status: 400 });
    }

    const checklist = await generateEventPrepChecklist(uid, event);
    return NextResponse.json({ success: true, checklist });
  } catch (error) {
    logger.error('[Integrations Calendar API] Error compiling prep checklist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
