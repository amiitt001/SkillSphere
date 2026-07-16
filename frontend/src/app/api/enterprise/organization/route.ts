import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getOrganization, addOrganizationDepartment, updateOrganizationSeats } from '@/services/enterprise/organizationEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const org = await getOrganization('org_default');
    return NextResponse.json({ success: true, organization: org });
  } catch (error) {
    logger.error('[Enterprise Org API] Error loading organization profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await req.json();
    const { department, seatsUsed } = body;

    let org = await getOrganization('org_default');

    if (department) {
      org = await addOrganizationDepartment('org_default', department);
    }
    if (typeof seatsUsed === 'number') {
      await updateOrganizationSeats('org_default', seatsUsed);
      org.seatsUsed = seatsUsed;
    }

    return NextResponse.json({ success: true, organization: org });
  } catch (error) {
    logger.error('[Enterprise Org API] Error modifying B2B parameters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
