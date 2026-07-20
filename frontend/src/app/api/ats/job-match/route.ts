import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { globalRateLimiter } from '@/lib/rateLimit';
import { runJobMatchATS } from '@/services/ats';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  resumeText: z.string().min(50).max(20000),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters.').max(15000),
  targetRole: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
});

/**
 * POST /api/ats/job-match
 * Deterministic Job Match ATS Score — no LLM, < 800ms.
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';
    const rateLimitKey = `ats-job-match:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 5, 60000)) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.issues.map((e) => e.message).join(', '), 400);
    }

    const { resumeText, jobDescription, targetRole, industry } = result.data;

    const reports = runJobMatchATS({ resumeText, jobDescription, targetRole, industry });

    const latency = Date.now() - start;
    logger.info(
      `[ATS Job Match] [ReqId: ${requestId}] Universal: ${reports.universalReport.universalScore}, ` +
      `Match: ${reports.jobMatchReport.jobMatchScore}, Latency: ${latency}ms for ${userId}`
    );

    if (latency > 800) {
      logger.warn(`[ATS Job Match] [ReqId: ${requestId}] Exceeded 800ms target: ${latency}ms`);
    }

    return successResponse(reports);

  } catch (error) {
    logger.error(`[ATS Job Match] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse('Error computing job match score.', 500);
  }
}
