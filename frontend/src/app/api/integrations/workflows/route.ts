import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getWorkspaceWorkflows, saveWorkspaceWorkflow } from '@/services/integrations/automationEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const workflows = await getWorkspaceWorkflows(uid);
    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    logger.error('[Integrations Workflows API] Error listing workspace rules:', error);
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
    const { id, name, triggerEvent, actionType, enabled } = body;

    if (!id || !name || !triggerEvent || !actionType) {
      return NextResponse.json({ error: 'Missing required workspace rule parameters' }, { status: 400 });
    }

    const flow = { id, name, triggerEvent, actionType, enabled };
    await saveWorkspaceWorkflow(uid, flow);

    return NextResponse.json({ success: true, workflow: flow });
  } catch (error) {
    logger.error('[Integrations Workflows API] Error saving rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
