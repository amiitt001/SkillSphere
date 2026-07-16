import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { recommendProjects } from '@/services/recommendations/projectRecommendationEngine';
import { checkGeneralEligibility } from '@/services/recommendations/eligibilityEngine';
import { calculateRelevanceScores } from '@/services/recommendations/rankingEngine';
import { MOCK_PROJECTS } from '@/services/recommendations/data/mockCatalog';
import type { ProjectRecommendation } from '@/services/recommendations/types';

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

    const rawProjects = recommendProjects(MOCK_PROJECTS, profile, aiAnalysis);
    const projects: ProjectRecommendation[] = rawProjects
      .filter((p) => !ignoredIds.includes(p.id))
      .map((p) => {
        const eligibility = checkGeneralEligibility(p.difficulty, userSkillCount);
        const scores = calculateRelevanceScores({
          relevance: p.skillsToGain.length > 0 ? 85 : 45,
          impact: p.impactScore,
          difficultyLevel: p.difficulty,
          timeToComplete: p.estimatedTime,
          weights: { relevance: 0.4, impact: 0.4, difficulty: 0.2 }
        });
        return {
          ...p,
          scores,
          eligibility,
          isBookmarked: bookmarks.includes(p.id),
          isCompleted: completedItemIds.includes(p.id)
        };
      })
      .sort((a, b) => b.scores.overall - a.scores.overall);

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
