import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { quizAi } from '@/services/ai';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { skillQuizSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/skill-quiz
 * Generates quiz questions based on selected skills and difficulty level.
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      logger.audit(`skill-quiz [ReqId: ${requestId}]`, 'anonymous', false, { error: authResult.error });
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiting check
    const rateLimitKey = `skill-quiz:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 5, 60000)) {
      logger.warn(`[Skill Quiz API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await request.json();
    const result = skillQuizSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      logger.warn(`[Skill Quiz API] [ReqId: ${requestId}] Validation failed: ${errorMsg}`);
      return errorResponse(errorMsg, 400);
    }

    const { skills, difficulty, questionCount } = result.data;

    logger.info(`[Skill Quiz API] [ReqId: ${requestId}] Generating quiz questions for user: ${userId}`, {
      skillsCount: skills.length,
      difficulty,
      questionCount,
    });

    const aiRes = await quizAi.generateQuiz(skills, difficulty, questionCount);
    const latency = Date.now() - start;

    logger.info(`[Skill Quiz API] [ReqId: ${requestId}] Completed successfully in ${latency}ms`);

    return successResponse(aiRes.data);

  } catch (error) {
    logger.error(`[Skill Quiz API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("Error generating quiz.", 500);
  }
}
