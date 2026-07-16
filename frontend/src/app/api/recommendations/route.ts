import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { generateRecommendationFeed } from '@/services/recommendations/recommendationEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;

    // 1. Fetch user data from Firestore
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: 'User profile not found. Please complete your profile first.' }, { status: 404 });
    }

    const userData = userDocSnap.data();
    const profile = userData.unifiedProfile;
    const aiAnalysis = userData.aiAnalysis || null;
    const userYear = userData.year || '3rd Year';

    if (!profile) {
      return NextResponse.json({ error: 'Unified Profile not synchronized. Please sync via Aggregator page.' }, { status: 400 });
    }

    // 2. Fetch user interaction subcollections in parallel
    const [bookmarksSnap, applicationsSnap, progressSnap, ignoredSnap] = await Promise.all([
      getDocs(collection(db, 'users', uid, 'bookmarks')),
      getDocs(collection(db, 'users', uid, 'applications')),
      getDocs(collection(db, 'users', uid, 'progress')),
      getDocs(collection(db, 'users', uid, 'ignored'))
    ]);

    const bookmarks = bookmarksSnap.docs.map((doc) => doc.id);
    const ignoredIds = ignoredSnap.docs.map((doc) => doc.id);
    
    const appliedJobIds: Record<string, string> = {};
    applicationsSnap.docs.forEach((doc) => {
      appliedJobIds[doc.id] = doc.data().status || 'applied';
    });

    const completedItemIds: string[] = [];
    progressSnap.docs.forEach((doc) => {
      if (doc.data().status === 'completed') {
        completedItemIds.push(doc.id);
      }
    });

    // 3. Generate recommendation feed
    const feed = await generateRecommendationFeed(
      profile,
      aiAnalysis,
      userYear,
      bookmarks,
      appliedJobIds,
      completedItemIds,
      ignoredIds
    );

    return NextResponse.json({ success: true, feed });

  } catch (error) {
    logger.error(`[Recommendations API] [ReqId: ${requestId}] Unhandled error:`, error);
    return NextResponse.json({ error: 'Internal server error while compiling recommendations.' }, { status: 500 });
  }
}
