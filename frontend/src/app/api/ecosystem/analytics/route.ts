import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { hasPermission } from '@/services/ecosystem/tenantSecurity';
import { computeUniversityStats, getPlacementIntelligence } from '@/services/ecosystem/universityIntelligence';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const userSnap = await getDoc(doc(db, 'users', uid));
    const userData = userSnap.exists() ? userSnap.data() : { role: 'Student', organizationId: 'org_iitb' };
    const userRole = userData.role || 'Student';
    const userOrgId = userData.organizationId || 'org_iitb';

    // Verify permission to view university metrics
    if (!hasPermission(userRole, 'view_university_metrics')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions' }, { status: 403 });
    }

    // Compute metrics under active organization tenant
    const stats = computeUniversityStats(userOrgId);
    const forecast = await getPlacementIntelligence(userOrgId);

    // Mock Recruiter Hiring Funnel analytics if needed
    const hiringFunnel = {
      sourced: 40,
      screened: 22,
      interviewed: 10,
      offered: 3
    };

    return NextResponse.json({
      success: true,
      stats,
      forecast,
      hiringFunnel
    });

  } catch (error) {
    logger.error('[Ecosystem Analytics API] Error generating metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
