import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getDeveloperKeys, generateDeveloperKey, revokeDeveloperKey } from '@/services/enterprise/pluginSdk';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const keys = await getDeveloperKeys(uid);
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    logger.error('[Enterprise Developer API] Error loading keys:', error);
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
    const { action, description, keyId } = body;

    if (action === 'generate') {
      const key = await generateDeveloperKey(uid, description || 'My API Key');
      return NextResponse.json({ success: true, key });
    } else if (action === 'revoke') {
      if (!keyId) return NextResponse.json({ error: 'Missing keyId' }, { status: 400 });
      await revokeDeveloperKey(uid, keyId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    logger.error('[Enterprise Developer API] Error managing tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
