import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/career-status
 * Returns the user's committed career goal and key blueprint metrics.
 * Lightweight — reads only the top-level user document fields needed for the dashboard gate.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const db = getFirestore();
    const userSnap = await db.collection('users').doc(uid).get();

    if (!userSnap.exists) {
      return NextResponse.json({ hasCareer: false });
    }

    const data = userSnap.data() || {};
    const goal = data.primaryCareerGoal as string | undefined;

    if (!goal) {
      return NextResponse.json({ hasCareer: false });
    }

    const blueprint = data.careerBlueprint || {};
    const careerHealth: number = blueprint?.careerHealth?.overallScore ?? 0;
    const readinessScore: number = blueprint?.skillGap?.readinessScore ?? 0;

    // Pull the first phase of the learning roadmap as the "next milestone"
    const roadmap: any[] = blueprint?.learningRoadmap ?? [];
    const nextMilestone: string = roadmap[0]?.phase ?? 'Set up your learning path';

    const targetCompanies: string[] = (blueprint?.targetCompanies ?? []).slice(0, 3);

    // Rough progress: average of health + readiness
    const progress = Math.round((careerHealth + readinessScore) / 2);

    return NextResponse.json({
      hasCareer: true,
      primaryCareerGoal: goal,
      careerHealth,
      readinessScore,
      nextMilestone,
      targetCompanies,
      progress,
      previousCareers: data.previousCareers ?? [],
    });
  } catch (err: any) {
    console.error('[career-status]', err);
    return NextResponse.json({ hasCareer: false, error: err.message }, { status: 500 });
  }
}
