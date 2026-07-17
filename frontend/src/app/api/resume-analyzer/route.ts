import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { resumeAi } from '@/services/ai';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { resumeAnalyzerSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/resume-analyzer
 * Accepts resume text (extracted client-side) and target career,
 * sends to AI Engine for comprehensive analysis.
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      logger.audit(`resume-analyzer [ReqId: ${requestId}]`, 'anonymous', false, { error: authResult.error });
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiting check - 3 requests per minute limit
    const rateLimitKey = `resume-analyzer:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 3, 60000)) {
      logger.warn(`[Resume Analyzer API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await request.json();
    const result = resumeAnalyzerSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      logger.warn(`[Resume Analyzer API] [ReqId: ${requestId}] Validation failed: ${errorMsg}`);
      return errorResponse(errorMsg, 400);
    }

    const { resumeText, targetCareer } = result.data;

    logger.info(`[Resume Analyzer API] [ReqId: ${requestId}] Analyzing resume for user: ${userId}`, {
      targetCareer,
      resumeLength: resumeText.length,
    });

    const aiRes = await resumeAi.analyzeResume(resumeText, targetCareer || undefined);
    const latency = Date.now() - start;

    logger.info(`[Resume Analyzer API] [ReqId: ${requestId}] Completed successfully in ${latency}ms`);

    return successResponse(aiRes.data);

  } catch (error) {
    logger.error(`[Resume Analyzer API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("Error analyzing resume.", 500);
  }
}
