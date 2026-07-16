import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { recommendCertifications } from '@/services/recommendations/certificationEngine';
import { checkGeneralEligibility } from '@/services/recommendations/eligibilityEngine';
import { calculateRelevanceScores } from '@/services/recommendations/rankingEngine';
import { MOCK_CERTIFICATIONS } from '@/services/recommendations/data/mockCatalog';
import type { CertificationRecommendation } from '@/services/recommendations/types';

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

    const rawCerts = recommendCertifications(MOCK_CERTIFICATIONS, profile, aiAnalysis);
    const certifications: CertificationRecommendation[] = rawCerts
      .filter((cert) => !ignoredIds.includes(cert.id))
      .map((cert) => {
        const eligibility = checkGeneralEligibility('Intermediate', userSkillCount);
        const scores = calculateRelevanceScores({
          relevance: cert.skillsAddressed.some(s => !profile.skills.map(us => us.toLowerCase()).includes(s.toLowerCase())) ? 75 : 50,
          impact: cert.roiScore,
          difficultyLevel: 'Intermediate',
          timeToComplete: cert.timeInvestment,
          weights: { relevance: 0.3, impact: 0.5, difficulty: 0.2 }
        });
        return {
          ...cert,
          scores,
          eligibility,
          isBookmarked: bookmarks.includes(cert.id),
          isCompleted: completedItemIds.includes(cert.id)
        };
      })
      .sort((a, b) => b.scores.overall - a.scores.overall);

    return NextResponse.json({ success: true, certifications });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
