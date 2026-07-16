import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getConnectedAccounts } from '@/services/integrations/integrationRegistry';
import { saveCredentials, deleteCredentials } from '@/services/integrations/credentialManager';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const accounts = await getConnectedAccounts(uid);
    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    logger.error('[Integrations Connect API] Error loading accounts list:', error);
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
    const { integrationId, connect } = body;

    if (!integrationId) {
      return NextResponse.json({ error: 'Missing integrationId' }, { status: 400 });
    }

    if (connect) {
      // Connect: Save mock credentials
      const mockTokens = { accessToken: `mock_oauth_${Math.random().toString(36).substring(7)}` };
      await saveCredentials(uid, integrationId, mockTokens);
    } else {
      // Disconnect: Delete credentials
      await deleteCredentials(uid, integrationId);
    }

    const accounts = await getConnectedAccounts(uid);
    return NextResponse.json({ success: true, accounts });

  } catch (error) {
    logger.error('[Integrations Connect API] Error managing integration link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
