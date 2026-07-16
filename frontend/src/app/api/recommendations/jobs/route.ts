import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { recommendJobs } from '@/services/recommendations/jobEngine';
import { checkJobEligibility } from '@/services/recommendations/eligibilityEngine';
import { calculateRelevanceScores } from '@/services/recommendations/rankingEngine';
import { MOCK_JOBS } from '@/services/recommendations/data/mockCatalog';
import type { JobRecommendation } from '@/services/recommendations/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;

    const userDocSnap = await getDoc(doc(db, 'users', uid));
    if (!userDocSnap.exists() || !userDocSnap.data()?.unifiedProfile) {
      return NextResponse.json({ error: 'Profile not initialized' }, { status: 400 });
    }

    const userData = userDocSnap.data();
    const profile = userData.unifiedProfile;
    const aiAnalysis = userData.aiAnalysis || null;

    const [bookmarksSnap, applicationsSnap, ignoredSnap] = await Promise.all([
      getDocs(collection(db, 'users', uid, 'bookmarks')),
      getDocs(collection(db, 'users', uid, 'applications')),
      getDocs(collection(db, 'users', uid, 'ignored'))
    ]);

    const bookmarks = bookmarksSnap.docs.map((doc) => doc.id);
    const ignoredIds = ignoredSnap.docs.map((doc) => doc.id);
    const appliedJobIds: Record<string, string> = {};
    applicationsSnap.docs.forEach((doc) => {
      appliedJobIds[doc.id] = doc.data().status || 'applied';
    });

    const rawJobs = recommendJobs(MOCK_JOBS, profile, aiAnalysis);
    const jobs: JobRecommendation[] = rawJobs
      .filter((j) => !ignoredIds.includes(j.id))
      .map((j) => {
        const eligibility = checkJobEligibility(j, j.missingSkills, profile);
        const scores = calculateRelevanceScores({
          relevance: j.matchPercentage,
          impact: eligibility.status === 'Eligible' ? 80 : eligibility.status === 'Nearly Eligible' ? 50 : 20,
          difficultyLevel: j.difficultyLevel,
          timeToComplete: 'Immediate',
          weights: { relevance: 0.4, impact: 0.3, difficulty: 0.3 }
        });
        return {
          ...j,
          scores,
          eligibility,
          isBookmarked: bookmarks.includes(j.id),
          applicationStatus: appliedJobIds[j.id] || undefined
        };
      })
      .sort((a, b) => b.scores.overall - a.scores.overall);

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
