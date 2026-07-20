import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { globalRateLimiter } from '@/lib/rateLimit';
import { runATSExplain } from '@/services/ats';
import type { UniversalATSReport, JobMatchReport } from '@/services/ats';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  universalReport: z.object({}).passthrough(),   // Accept any shape — validated by engine types
  jobMatchReport: z.object({}).passthrough().optional(),
  resumeText: z.string().max(20000),
  jobDescription: z.string().max(15000).optional(),
});

/**
 * POST /api/ats/explain
 * AI Explanation Layer — receives pre-computed reports, returns text only.
 * Target: < 3s. LLM is ONLY called here.
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
    const rateLimitKey = `ats-explain:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 3, 60000)) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.issues.map((e) => e.message).join(', '), 400);
    }

    const combinedReport = await runATSExplain({
      universalReport: result.data.universalReport as unknown as UniversalATSReport,
      jobMatchReport: result.data.jobMatchReport as unknown as JobMatchReport | undefined,
      resumeText: result.data.resumeText,
      jobDescription: result.data.jobDescription,
    });

    const latency = Date.now() - start;
    logger.info(`[ATS Explain] [ReqId: ${requestId}] Completed in ${latency}ms for ${userId}`);

    if (latency > 3000) {
      logger.warn(`[ATS Explain] [ReqId: ${requestId}] Exceeded 3s target: ${latency}ms`);
    }

    return successResponse(combinedReport);

  } catch (error) {
    logger.error(`[ATS Explain] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse('Error generating ATS explanation.', 500);
  }
}
