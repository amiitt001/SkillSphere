/**
 * POST /api/job-intelligence/save  — Save a job to the user's tracked list
 * DELETE /api/job-intelligence/save  — Remove a saved job by jobId
 */

import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { logger } from '@/services/logger';
import { errorResponse, successResponse } from '@/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) return errorResponse(authResult.error, authResult.status || 401);
    const uid = authResult.user!.uid;

    const body = await req.json();
    const { jobDescription, matchReport, artifacts } = body;

    if (!jobDescription || !matchReport) {
      return errorResponse('jobDescription and matchReport are required.', 400);
    }

    const db = getFirestore();
    const savedJobRef = db.collection('users').doc(uid).collection('savedJobs').doc();

    const savedJob = {
      uid,
      jobDescription,
      matchReport,
      artifacts: artifacts || null,
      savedAt: new Date().toISOString(),
      lastRecalculatedAt: new Date().toISOString(),
      applicationStatus: 'saved',
    };

    await savedJobRef.set(savedJob);

    logger.info(`[Job Save API] [${requestId}] Saved job "${jobDescription.title}" for uid: ${uid}`);
    return successResponse({ success: true, jobId: savedJobRef.id, savedJob });

  } catch (err: any) {
    logger.error(`[Job Save API] [${requestId}] Error:`, err);
    return errorResponse(err.message || 'Error saving job.', 500);
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) return errorResponse(authResult.error, authResult.status || 401);
    const uid = authResult.user!.uid;

    const { jobId } = await req.json();
    if (!jobId) return errorResponse('jobId is required.', 400);

    const db = getFirestore();
    await db.collection('users').doc(uid).collection('savedJobs').doc(jobId).delete();

    logger.info(`[Job Save API] [${requestId}] Deleted job ${jobId} for uid: ${uid}`);
    return successResponse({ success: true, jobId });

  } catch (err: any) {
    logger.error(`[Job Save API] [${requestId}] Error:`, err);
    return errorResponse(err.message || 'Error removing job.', 500);
  }
}

export async function PATCH(req: NextRequest) {
  // Update application status or notes on a saved job
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) return errorResponse(authResult.error, authResult.status || 401);
    const uid = authResult.user!.uid;

    const { jobId, applicationStatus, notes } = await req.json();
    if (!jobId) return errorResponse('jobId is required.', 400);

    const db = getFirestore();
    const updates: Record<string, any> = {};
    if (applicationStatus) updates.applicationStatus = applicationStatus;
    if (notes !== undefined) updates.notes = notes;

    await db.collection('users').doc(uid).collection('savedJobs').doc(jobId).update(updates);

    logger.info(`[Job Save API] [${requestId}] Updated job ${jobId}`);
    return successResponse({ success: true, jobId });

  } catch (err: any) {
    logger.error(`[Job Save API] [${requestId}] Error:`, err);
    return errorResponse(err.message || 'Error updating job.', 500);
  }
}
