import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { exportUserDataPackage, eraseUserDataRecord, getComplianceAuditLogs } from '@/services/enterprise/complianceEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'export') {
      const data = await exportUserDataPackage(uid);
      return NextResponse.json({ success: true, data });
    }

    // Default: returns compliance audits logs list
    const logs = await getComplianceAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    logger.error('[Enterprise Compliance API] Error carrying out requests:', error);
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
    const { action } = body;

    if (action === 'erase') {
      await eraseUserDataRecord(uid);
      return NextResponse.json({ success: true, message: 'Account erased successfully' });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    logger.error('[Enterprise Compliance API] Error executing erasure:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
