import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { onboardingEngine } from '@/services/onboarding/onboardingEngine';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { globalRateLimiter } from '@/lib/rateLimit';
import { cacheProvider } from '@/shared/infrastructure/cache/cacheProvider';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieves onboarding completeness details and the next smart question.
 */
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid;
    if (!userId) return errorResponse('User ID not found.', 401);

    const data = await onboardingEngine.getStatusAndQuestion(userId);
    return successResponse(data);
  } catch (error: any) {
    logger.error(`[Question API GET] [ReqId: ${requestId}] Error:`, error);
    return errorResponse(error.message || 'Error loading question.', 500);
  }
}

/**
 * POST: Saves a single question answer and returns updated status.
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid;
    if (!userId) return errorResponse('User ID not found.', 401);

    const body = await request.json();
    const { field, value } = body;

    if (!field) {
      return errorResponse('Field name is required.', 400);
    }

    const updatedProfile = await onboardingEngine.saveQuestionAnswer(userId, field, value);
    if (!updatedProfile) {
      return errorResponse('Failed to save answer.', 500);
    }

    const nextData = await onboardingEngine.getStatusAndQuestion(userId);
    return successResponse({
      profile: updatedProfile,
      ...nextData
    });
  } catch (error: any) {
    logger.error(`[Question API POST] [ReqId: ${requestId}] Error:`, error);
    return errorResponse(error.message || 'Error saving answer.', 500);
  }
}

/**
 * PUT: Saves the entire approved resume parsing draft.
 */
export async function PUT(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid;
    if (!userId) return errorResponse('User ID not found.', 401);

    const body = await request.json();
    const { draft } = body;

    if (!draft) {
      return errorResponse('Draft profile object is required.', 400);
    }

    const updatedProfile = await onboardingEngine.saveApprovedDraft(userId, draft);

    // Invalidate all cached career recommendations for this user.
    // The new resume may have completely different skills/experience.
    try {
      await cacheProvider.deleteByPrefix(`recommendations:${userId}:`);
      logger.info(`[Question API PUT] Cleared stale recommendation cache for user: ${userId}`);
    } catch (cacheErr) {
      logger.warn('[Question API PUT] Failed to clear recommendation cache:', cacheErr);
    }

    const nextData = await onboardingEngine.getStatusAndQuestion(userId);
    return successResponse({
      profile: updatedProfile,
      ...nextData
    });
  } catch (error: any) {
    logger.error(`[Question API PUT] [ReqId: ${requestId}] Error:`, error);
    return errorResponse(error.stack || error.message || 'Error saving approved draft.', 500);
  }
}
