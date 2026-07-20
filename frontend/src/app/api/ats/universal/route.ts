import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { globalRateLimiter } from '@/lib/rateLimit';
import { runUniversalATS } from '@/services/ats';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters.').max(20000, 'Resume text too long.'),
});

/**
 * POST /api/ats/universal
 * Deterministic Universal ATS Score — no LLM, < 500ms.
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
    const rateLimitKey = `ats-universal:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 10, 60000)) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.issues.map((e) => e.message).join(', '), 400);
    }

    const report = runUniversalATS({ resumeText: result.data.resumeText });

    const latency = Date.now() - start;
    logger.info(`[ATS Universal] [ReqId: ${requestId}] Score: ${report.universalScore} in ${latency}ms for ${userId}`);

    if (latency > 500) {
      logger.warn(`[ATS Universal] [ReqId: ${requestId}] Exceeded 500ms target: ${latency}ms`);
    }

    return successResponse(report);

  } catch (error) {
    logger.error(`[ATS Universal] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse('Error computing ATS score.', 500);
  }
}
