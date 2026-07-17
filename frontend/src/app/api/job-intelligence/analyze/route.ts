/**
 * POST /api/job-intelligence/analyze
 *
 * Accepts: { source: 'url'|'text'|'pdf', content: string }
 *   - 'url':  content = job posting URL
 *   - 'text': content = pasted job description
 *   - 'pdf':  content = base64-encoded PDF bytes
 *
 * Reads the Unified User Profile from Firestore — no resume re-upload.
 * Returns: { jobDescription, matchReport, artifacts, processingTime }
 */

import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { jobIntelligenceEngine } from '@/features/jobs/jobIntelligenceEngine';
import { globalRateLimiter } from '@/lib/rateLimit';
import { logger } from '@/services/logger';
import { errorResponse, successResponse } from '@/utils';
import type { JobInputSource } from '@/types/job';

export const dynamic = 'force-dynamic';
// PDF uploads can be large — increase body size limit
export const maxDuration = 60; // 60 seconds for AI pipeline

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const start = Date.now();

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }
    const uid = authResult.user!.uid;

    // ── Rate Limit ────────────────────────────────────────────────────────
    if (!globalRateLimiter.check(`job-intelligence:${uid}`, 5, 60000)) {
      return errorResponse('Too many analysis requests. Please wait a moment.', 429);
    }

    // ── Parse Body ────────────────────────────────────────────────────────
    const body = await req.json();
    const { source, content } = body as { source: JobInputSource; content: string };

    if (!source || !['url', 'text', 'pdf'].includes(source)) {
      return errorResponse('source must be "url", "text", or "pdf".', 400);
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return errorResponse('content is required.', 400);
    }

    // ── Load Unified Profile (single source of truth) ─────────────────────
    const db = getFirestore();
    const userSnap = await db.collection('users').doc(uid).get();

    if (!userSnap.exists) {
      return errorResponse('User profile not found. Please complete your profile first.', 404);
    }

    const userData = userSnap.data() || {};
    const profile = userData.unifiedProfile;

    if (!profile) {
      return errorResponse(
        'Unified Profile not found. Please complete your profile or upload your resume first.',
        400
      );
    }

    // Attach top-level career goal so the engine can reference it
    profile.primaryCareerGoal = userData.primaryCareerGoal || null;

    logger.info(`[Job Intelligence API] [${requestId}] Analyzing job for uid: ${uid} via source: ${source}`);

    // ── Run Engine ────────────────────────────────────────────────────────
    const result = await jobIntelligenceEngine.analyze({ source, content }, profile);

    const latency = Date.now() - start;
    logger.info(`[Job Intelligence API] [${requestId}] Done in ${latency}ms — score: ${result.matchReport.scores.overall}`);

    return successResponse({ ...result, requestId });

  } catch (err: any) {
    logger.error(`[Job Intelligence API] [${requestId}] Error:`, err);
    return errorResponse(err.message || 'Error analyzing job description.', 500);
  }
}
