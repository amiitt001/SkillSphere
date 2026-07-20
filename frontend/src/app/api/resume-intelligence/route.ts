import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { globalRateLimiter } from '@/lib/rateLimit';
import { profileMemory } from '@/services/onboarding/profileMemory';
import { profileVersionManager } from '@/services/resume-intelligence';
import { onboardingEngine } from '@/services/onboarding/onboardingEngine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/resume-intelligence
 * Fetches the canonical Unified User Profile, version history, and status for the authenticated user.
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

    const rateLimitKey = `resume-intelligence-get:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 30, 60000)) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    // Fetch profile and version history in parallel
    const [profile, versionHistory] = await Promise.all([
      profileMemory.getProfile(userId).catch(() => null),
      profileVersionManager.getVersionHistory(userId).catch(() => []),
    ]);

    const hasProfile = Boolean(profile && profile.personalInfo && ((profile.skills && profile.skills.length > 0) || (profile.experience && profile.experience.length > 0)));
    const versionNumber = profile?.profileVersion || (versionHistory.length > 0 ? versionHistory[0].versionNumber : 1);
    const lastVersion = versionHistory.length > 0 ? versionHistory[0] : null;

    const latency = Date.now() - start;
    logger.info(`[Resume Intelligence GET] [ReqId: ${requestId}] User: ${userId}, HasProfile: ${hasProfile}, Latency: ${latency}ms`);

    return successResponse({
      hasProfile,
      profile,
      versionNumber,
      versionHistory,
      lastVersion,
      uploadButtonLabel: hasProfile ? 'Upload Updated Resume' : 'Upload Resume',
      statusVerificationLine: hasProfile
        ? `✓ Resume uploaded — using profile Version ${versionNumber} across the platform`
        : 'No resume profile initialized yet',
    });
  } catch (error: any) {
    logger.error(`[Resume Intelligence GET] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse(error.message || 'Error fetching resume intelligence data.', 500);
  }
}

/**
 * POST /api/resume-intelligence
 * Saves an approved draft, updates specific profile fields, or merges canonical profile data.
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

    const rateLimitKey = `resume-intelligence-post:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 15, 60000)) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const body = await request.json();
    let savedProfile = null;

    if (body.draft) {
      // Save approved parsed resume draft
      savedProfile = await onboardingEngine.saveApprovedDraft(userId, body.draft);
    } else if (body.field) {
      // Save targeted single missing field
      savedProfile = await onboardingEngine.saveQuestionAnswer(userId, body.field, body.value);
    } else if (body.profile) {
      // Save/merge canonical profile object
      savedProfile = await profileMemory.saveProfile(userId, body.profile);
    } else {
      return errorResponse('Must provide draft, field, or profile to update.', 400);
    }

    const latency = Date.now() - start;
    logger.info(`[Resume Intelligence POST] [ReqId: ${requestId}] Profile updated for ${userId} in ${latency}ms`);

    return successResponse({
      message: 'Unified User Profile updated successfully.',
      profile: savedProfile,
    });
  } catch (error: any) {
    logger.error(`[Resume Intelligence POST] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse(error.message || 'Error updating resume profile.', 500);
  }
}
