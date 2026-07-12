import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { projectAi } from '@/services/ai';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { projectGeneratorSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/project-generator
 * Generates AI-powered project ideas based on target career, skill level, and existing skills.
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      logger.auth(undefined, `project-generator [ReqId: ${requestId}]`, false, authResult.error);
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiting check
    const rateLimitKey = `project-generator:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 5, 60000)) {
      logger.warn(`[Project Generator API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    // --- 1. PARSE & VALIDATE SEARCH PARAMETERS ---
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      career: searchParams.get('career'),
      skillLevel: searchParams.get('skillLevel') || 'intermediate',
      skills: searchParams.get('skills') || '',
    };

    const result = projectGeneratorSchema.safeParse(queryData);
    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      logger.warn(`[Project Generator API] [ReqId: ${requestId}] Validation failed: ${errorMsg}`);
      return errorResponse(errorMsg, 400);
    }

    const { career, skillLevel, skills } = result.data;

    logger.info(`[Project Generator API] [ReqId: ${requestId}] Generating project ideas for user: ${userId}`, {
      career,
      skillLevel,
    });

    const aiRes = await projectAi.generateProjects(career, skillLevel, skills || undefined);
    const latency = Date.now() - start;

    logger.info(`[Project Generator API] [ReqId: ${requestId}] Completed successfully in ${latency}ms`);

    return successResponse(aiRes.data);

  } catch (error) {
    logger.error(`[Project Generator API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("Error generating project ideas.", 500);
  }
}
