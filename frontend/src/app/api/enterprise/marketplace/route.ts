import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getMarketplacePlugins, togglePluginInstallation } from '@/services/enterprise/marketplaceEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const plugins = await getMarketplacePlugins(uid);
    return NextResponse.json({ success: true, plugins });
  } catch (error) {
    logger.error('[Enterprise Marketplace API] Error listing extensions:', error);
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
    const { pluginId, install } = body;

    if (!pluginId) {
      return NextResponse.json({ error: 'Missing pluginId' }, { status: 400 });
    }

    const plugins = await togglePluginInstallation(uid, pluginId, install);
    return NextResponse.json({ success: true, plugins });
  } catch (error) {
    logger.error('[Enterprise Marketplace API] Error managing plugin installation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
