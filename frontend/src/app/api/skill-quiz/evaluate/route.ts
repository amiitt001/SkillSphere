import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { quizAi } from '@/services/ai';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { skillQuizEvaluateSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/skill-quiz/evaluate
 * Evaluates quiz answers and generates detailed skill analysis.
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      logger.audit(`skill-quiz-evaluate [ReqId: ${requestId}]`, 'anonymous', false, { error: authResult.error });
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiting check
    const rateLimitKey = `skill-quiz-evaluate:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 5, 60000)) {
      logger.warn(`[Skill Quiz Evaluate API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await request.json();
    const result = skillQuizEvaluateSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      logger.warn(`[Skill Quiz Evaluate API] [ReqId: ${requestId}] Validation failed: ${errorMsg}`);
      return errorResponse(errorMsg, 400);
    }

    const { questions, answers } = result.data;

    // Calculate scores per skill
    const skillMap: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q, i) => {
      if (!skillMap[q.skill]) {
        skillMap[q.skill] = { correct: 0, total: 0 };
      }
      skillMap[q.skill].total++;
      if (answers[i] === q.correctAnswer) {
        skillMap[q.skill].correct++;
      }
    });

    const scores = Object.entries(skillMap).map(([skill, data]) => {
      const score = Math.round((data.correct / data.total) * 100);
      let level: 'weak' | 'average' | 'strong' | 'expert' = 'weak';
      if (score >= 90) level = 'expert';
      else if (score >= 70) level = 'strong';
      else if (score >= 50) level = 'average';
      return { skill, score, maxScore: 100, level };
    });

    const overallCorrect = answers.reduce((acc: number, ans: number, i: number) => {
      return acc + (ans === questions[i].correctAnswer ? 1 : 0);
    }, 0);
    const overallScore = Math.round((overallCorrect / questions.length) * 100);

    const weakAreas = scores.filter((s) => s.level === 'weak' || s.level === 'average').map((s) => s.skill);
    const strongAreas = scores.filter((s) => s.level === 'strong' || s.level === 'expert').map((s) => s.skill);

    logger.info(`[Skill Quiz Evaluate API] [ReqId: ${requestId}] Evaluating quiz answers for user: ${userId}`, { overallScore });
    const aiRes = await quizAi.evaluateQuiz(overallScore, weakAreas, strongAreas, scores);
    const latency = Date.now() - start;

    logger.info(`[Skill Quiz Evaluate API] [ReqId: ${requestId}] Completed successfully in ${latency}ms`);

    return successResponse({
      overallScore,
      scores,
      recommendations: aiRes.data.recommendations || ['Focus on practicing the topics in your weak areas.'],
    });

  } catch (error) {
    logger.error(`[Skill Quiz Evaluate API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("Error evaluating quiz.", 500);
  }
}
