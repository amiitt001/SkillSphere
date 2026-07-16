import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { hasPermission, verifyTenantAccess } from '@/services/ecosystem/tenantSecurity';
import { MOCK_JOBS } from '@/services/ecosystem/mockEcosystemData';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    // Query jobs from DB + combine mock jobs
    const querySnap = await getDocs(collection(db, 'jobs'));
    const dbJobs = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const allJobs = [...MOCK_JOBS, ...dbJobs];
    return NextResponse.json({ success: true, jobs: allJobs });
  } catch (error) {
    logger.error('[Ecosystem Jobs API] Error listing jobs:', error);
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
    const userSnap = await getDoc(doc(db, 'users', uid));
    const userData = userSnap.exists() ? userSnap.data() : { role: 'Student', organizationId: 'org_iitb' };
    const userRole = userData.role || 'Student';
    const userOrgId = userData.organizationId || 'org_iitb';

    // Verify permission to post jobs
    if (!hasPermission(userRole, 'post_job')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { title, type, description, requirements, salary, location } = body;

    if (!title || !description || !requirements) {
      return NextResponse.json({ error: 'Missing title, description or requirements' }, { status: 400 });
    }

    const jobId = `job_${Math.random().toString(36).substring(7)}`;
    const newJob = {
      id: jobId,
      companyId: userOrgId,
      companyName: userOrgId === 'org_google' ? 'Google India' : userOrgId === 'org_razorpay' ? 'Razorpay' : 'Associated B2B Tenant',
      title,
      type,
      description,
      requirements: Array.isArray(requirements) ? requirements : requirements.split(','),
      salary: salary || 'Negotiable',
      location: location || 'Remote',
      status: 'active',
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
      serverTime: serverTimestamp()
    };

    // Save job globally in DB
    await setDoc(doc(db, 'jobs', jobId), newJob);

    return NextResponse.json({ success: true, job: newJob });

  } catch (error) {
    logger.error('[Ecosystem Jobs API] Error creating job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
