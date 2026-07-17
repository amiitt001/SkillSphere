/**
 * GET /api/job-intelligence/saved
 * Returns all saved jobs for the authenticated user, ordered by savedAt desc.
 */

import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { logger } from '@/services/logger';
import { errorResponse, successResponse } from '@/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) return errorResponse(authResult.error, authResult.status || 401);
    const uid = authResult.user!.uid;

    const db = getFirestore();
    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('savedJobs')
      .orderBy('savedAt', 'desc')
      .limit(50)
      .get();

    const jobs: any[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    logger.info(`[Saved Jobs API] [${requestId}] Fetched ${jobs.length} saved jobs for uid: ${uid}`);
    return successResponse({ jobs });

  } catch (err: any) {
    logger.error(`[Saved Jobs API] [${requestId}] Error:`, err);
    return errorResponse(err.message || 'Error fetching saved jobs.', 500);
  }
}
