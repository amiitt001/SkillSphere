import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getUserWorkflows, saveUserWorkflow } from '@/services/intelligence/automationEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const workflows = await getUserWorkflows(uid);
    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    logger.error('[Intelligence Workflows API] Error listing workflows rules:', error);
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
    const { id, name, triggerEvent, conditionFormula, actionType, actionPayload, enabled } = body;

    if (!id || !name || !triggerEvent || !actionType) {
      return NextResponse.json({ error: 'Missing required rule parameters' }, { status: 400 });
    }

    const rule = { id, name, triggerEvent, conditionFormula, actionType, actionPayload, enabled };
    await saveUserWorkflow(uid, rule);

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    logger.error('[Intelligence Workflows API] Error updating rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
