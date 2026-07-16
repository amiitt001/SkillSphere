import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { saveAiFeedback, getAiFeedbackList } from '@/services/intelligencePlatform/feedbackEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const feedbacks = await getAiFeedbackList();
    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    logger.error('[Intelligence Platform Feedback API] Error fetching logs:', error);
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
    const { id, itemId, itemType, rating, reason, comments } = body;

    if (!id || !itemId || !itemType || !rating) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const feedback = { id, itemId, itemType, rating, reason, comments, timestamp: new Date().toISOString() };
    await saveAiFeedback(uid, feedback);

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    logger.error('[Intelligence Platform Feedback API] Error saving rating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
