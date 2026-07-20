import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { onboardingEngine } from '@/services/onboarding/onboardingEngine';
import { resumeIntelligenceBuilder } from '@/services/resume-intelligence';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { globalRateLimiter } from '@/lib/rateLimit';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const start = Date.now();

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiter
    const rateLimitKey = `parse-resume:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 10, 60000)) {
      logger.warn(`[Parse Resume API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No resume file provided.', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[Parse Resume API] [ReqId: ${requestId}] Development upload snapshot`, {
        resumeFilename: file.name,
        mimeType: file.type || '',
      });
    }

    // Call the new Resume Intelligence Engine
    const { draft, rawText } = await resumeIntelligenceBuilder.processUpload(
      buffer,
      file.type || '',
      file.name,
      userId
    );
    const latency = Date.now() - start;
    logger.info(`[Parse Resume API] [ReqId: ${requestId}] Parsed file successfully via Resume Intelligence Engine in ${latency}ms`);

    // Persist resume details to the user document as the single source of truth
    if (userId !== 'anonymous') {
      const db = getFirestore();
      await db.collection('users').doc(userId).set({
        currentResumeFilename: file.name,
        currentResumeText: rawText,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    const compatibleDraft = resumeIntelligenceBuilder.mapToDraft(draft);
    return successResponse({ success: true, data: compatibleDraft });
  } catch (error: any) {
    logger.error(`[Parse Resume API] [ReqId: ${requestId}] Unexpected error:`, error);
    return errorResponse(error.stack || error.message || 'Error processing resume file.', 500);
  }
}
