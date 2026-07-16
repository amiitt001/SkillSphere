import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { hasPermission } from '@/services/ecosystem/tenantSecurity';
import { rankCandidatesForJob } from '@/services/ecosystem/candidateRanker';
import { MOCK_JOBS } from '@/services/ecosystem/mockEcosystemData';
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
    const userRole = userSnap.exists() ? userSnap.data().role || 'Student' : 'Student';

    // Verify permission to view student candidate analysis
    if (!hasPermission(userRole, 'view_student_analysis')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const jobId = searchParams.get('jobId') || 'job_google_1';
    const skillsParam = searchParams.get('skills');
    const skillsFilter = skillsParam ? skillsParam.split(',') : undefined;

    // Load selected job details
    const selectedJob = MOCK_JOBS.find(j => j.id === jobId) || MOCK_JOBS[0];

    // Rank candidates
    const rankedCandidates = await rankCandidatesForJob(selectedJob, skillsFilter);

    return NextResponse.json({ success: true, candidates: rankedCandidates });

  } catch (error) {
    logger.error('[Ecosystem Candidates API] Error listing candidates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
