import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { runCopilotConversation } from '@/services/copilot/copilotEngine';
import { getUserSessions } from '@/services/copilot/conversationManager';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

// GET all sessions
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const sessions = await getUserSessions(uid);
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    logger.error('[Copilot Chat API] Error listing sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST query message execution
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const { userMessage, sessionId, modeOverride } = await req.json();

    if (!userMessage || !sessionId) {
      return NextResponse.json({ error: 'Missing userMessage or sessionId' }, { status: 400 });
    }

    const result = await runCopilotConversation({
      uid,
      userMessage,
      sessionId,
      modeOverride
    });

    return NextResponse.json({
      success: true,
      response: result.response,
      mode: result.updatedMode
    });

  } catch (error) {
    logger.error('[Copilot Chat API] Error during dialogue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
