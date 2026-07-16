import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { recommendInternships } from '@/services/recommendations/internshipEngine';
import { checkInternshipEligibility } from '@/services/recommendations/eligibilityEngine';
import { calculateRelevanceScores } from '@/services/recommendations/rankingEngine';
import { MOCK_INTERNSHIPS } from '@/services/recommendations/data/mockCatalog';
import type { InternshipRecommendation } from '@/services/recommendations/types';

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
    const userYear = userData.year || '3rd Year';

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

    const rawInternships = recommendInternships(MOCK_INTERNSHIPS, profile, aiAnalysis);
    const internships: InternshipRecommendation[] = rawInternships
      .filter((i) => !ignoredIds.includes(i.id))
      .map((i) => {
        const eligibility = checkInternshipEligibility(i, i.missingSkills, userYear);
        const scores = calculateRelevanceScores({
          relevance: i.matchPercentage,
          impact: i.tier === 'Dream' ? 90 : i.tier === 'Stretch' ? 65 : 45,
          difficultyLevel: 'Entry',
          timeToComplete: i.duration,
          weights: { relevance: 0.4, impact: 0.3, difficulty: 0.3 }
        });
        return {
          ...i,
          scores,
          eligibility,
          isBookmarked: bookmarks.includes(i.id),
          applicationStatus: appliedJobIds[i.id] || undefined
        };
      })
      .sort((a, b) => b.scores.overall - a.scores.overall);

    return NextResponse.json({ success: true, internships });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
