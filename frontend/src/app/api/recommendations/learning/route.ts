import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { recommendCourses } from '@/services/recommendations/learningEngine';
import { checkGeneralEligibility } from '@/services/recommendations/eligibilityEngine';
import { calculateRelevanceScores } from '@/services/recommendations/rankingEngine';
import { MOCK_COURSES } from '@/services/recommendations/data/mockCatalog';
import type { LearningRecommendation } from '@/services/recommendations/types';

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
    const userSkillCount = profile.skills.length;

    const [bookmarksSnap, progressSnap, ignoredSnap] = await Promise.all([
      getDocs(collection(db, 'users', uid, 'bookmarks')),
      getDocs(collection(db, 'users', uid, 'progress')),
      getDocs(collection(db, 'users', uid, 'ignored'))
    ]);

    const bookmarks = bookmarksSnap.docs.map((doc) => doc.id);
    const ignoredIds = ignoredSnap.docs.map((doc) => doc.id);
    const completedItemIds = progressSnap.docs
      .filter(doc => doc.data().status === 'completed')
      .map((doc) => doc.id);

    const rawCourses = recommendCourses(MOCK_COURSES, profile, aiAnalysis);
    const learning: LearningRecommendation[] = rawCourses
      .filter((c) => !ignoredIds.includes(c.id))
      .map((c) => {
        const eligibility = checkGeneralEligibility(c.difficulty, userSkillCount);
        const impactScore = c.expectedImpact === 'Critical' ? 95 : c.expectedImpact === 'High' ? 80 : c.expectedImpact === 'Medium' ? 55 : 30;
        const scores = calculateRelevanceScores({
          relevance: c.skillsGained.some(s => !profile.skills.map(us => us.toLowerCase()).includes(s.toLowerCase())) ? 85 : 40,
          impact: impactScore,
          difficultyLevel: c.difficulty,
          timeToComplete: c.duration,
          weights: { relevance: 0.5, impact: 0.3, difficulty: 0.2 }
        });
        return {
          ...c,
          scores,
          eligibility,
          isBookmarked: bookmarks.includes(c.id),
          isCompleted: completedItemIds.includes(c.id)
        };
      })
      .sort((a, b) => b.scores.overall - a.scores.overall);

    return NextResponse.json({ success: true, learning });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
