import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { interviewAi } from '@/services/ai';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { interviewPrepSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/interview-prep
 * Generates interview questions or evaluates user answers based on career parameters.
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      logger.auth(undefined, `interview-prep [ReqId: ${requestId}]`, false, authResult.error);
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiting check
    const rateLimitKey = `interview-prep:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 5, 60000)) {
      logger.warn(`[Interview Prep API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await request.json();
    const result = interviewPrepSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      logger.warn(`[Interview Prep API] [ReqId: ${requestId}] Validation failed: ${errorMsg}`);
      return errorResponse(errorMsg, 400);
    }

    const { career, companyType, experienceLevel, action, question, answer } = result.data;

    // Evaluate user's answer
    if (action === 'evaluate') {
      logger.info(`[Interview Prep API] [ReqId: ${requestId}] Evaluating answer for user: ${userId}`, {
        career,
        companyType,
      });
      const aiRes = await interviewAi.evaluateAnswer(career, companyType, question!, answer!);
      const latency = Date.now() - start;
      logger.info(`[Interview Prep API] [ReqId: ${requestId}] Evaluation completed in ${latency}ms`);
      return successResponse(aiRes.data);
    }

    // Generate interview questions
    logger.info(`[Interview Prep API] [ReqId: ${requestId}] Generating questions for user: ${userId}`, {
      career,
      companyType,
      experienceLevel,
    });
    const aiRes = await interviewAi.generateQuestions(career, companyType, experienceLevel);
    const latency = Date.now() - start;
    logger.info(`[Interview Prep API] [ReqId: ${requestId}] Generation completed in ${latency}ms`);
    return successResponse(aiRes.data);

  } catch (error) {
    logger.error(`[Interview Prep API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("Error generating interview prep content.", 500);
  }
}
