import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { globalRateLimiter } from '@/lib/rateLimit';
import { profileVersionManager } from '@/services/resume-intelligence';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const rollbackSchema = z.object({
  versionNumber: z.number().int().positive('Version number must be a positive integer.'),
});

/**
 * GET /api/profile/versions
 * Retrieves a list of all historical versions for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid;
    if (!userId) return errorResponse('User ID not found.', 401);

    const rateLimitKey = `profile-versions-get:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 15, 60000)) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const history = await profileVersionManager.getVersionHistory(userId);

    const latency = Date.now() - start;
    logger.info(`[Profile Versions GET] [ReqId: ${requestId}] Found ${history.length} versions in ${latency}ms for ${userId}`);

    return successResponse(history);
  } catch (error: any) {
    logger.error(`[Profile Versions GET] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse(error.message || 'Error fetching profile version history.', 500);
  }
}

/**
 * POST /api/profile/versions
 * Performs profile rollback to a specific version number.
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid;
    if (!userId) return errorResponse('User ID not found.', 401);

    const rateLimitKey = `profile-versions-post:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 5, 60000)) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const body = await request.json();
    const result = rollbackSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.issues.map((e) => e.message).join(', '), 400);
    }

    const rolledProfile = await profileVersionManager.rollbackToVersion(userId, result.data.versionNumber);

    const latency = Date.now() - start;
    logger.info(`[Profile Versions POST] [ReqId: ${requestId}] Rolled back to version ${result.data.versionNumber} in ${latency}ms for ${userId}`);

    return successResponse({
      message: `Profile successfully rolled back to version ${result.data.versionNumber}.`,
      profile: rolledProfile,
    });
  } catch (error: any) {
    logger.error(`[Profile Versions POST] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse(error.message || 'Error performing profile rollback.', 500);
  }
}
