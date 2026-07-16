import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;

    const [applicationsSnap, progressSnap, bookmarksSnap] = await Promise.all([
      getDocs(collection(db, 'users', uid, 'applications')),
      getDocs(collection(db, 'users', uid, 'progress')),
      getDocs(collection(db, 'users', uid, 'bookmarks'))
    ]);

    const applications = applicationsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const progress = progressSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const bookmarks = bookmarksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const applicationsSubmitted = applications.length;
    const coursesCompleted = progress.filter((p: any) => p.type === 'course' && p.status === 'completed').length;
    const projectsFinished = progress.filter((p: any) => p.type === 'project' && p.status === 'completed').length;
    const certificationsCompleted = progress.filter((p: any) => p.type === 'certification' && p.status === 'completed').length;

    // Standard baseline stats calculations
    const recommendationAcceptanceRate = Math.round(
      ((applicationsSubmitted + coursesCompleted + projectsFinished) / Math.max(1, bookmarks.length + applicationsSubmitted + progress.length)) * 100
    ) || 75;

    const careerScoreImprovement = Math.min(15, (coursesCompleted * 3) + (projectsFinished * 4) + (certificationsCompleted * 5));

    return NextResponse.json({
      success: true,
      analytics: {
        applicationsSubmitted,
        coursesCompleted,
        projectsFinished,
        certificationsCompleted,
        recommendationAcceptanceRate: Math.min(100, recommendationAcceptanceRate),
        careerScoreImprovement,
        recentApplications: applications.slice(0, 5),
        recentProgress: progress.slice(0, 5)
      }
    });

  } catch (error) {
    logger.error('[Analytics API] Error retrieving analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
