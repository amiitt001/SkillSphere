import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { careerAi } from '@/services/ai';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { generateRecommendationsSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';
import { contextBuilder } from '@/services/onboarding/contextBuilder';

export const dynamic = 'force-dynamic';

/**
 * Handles the GET request to generate career recommendations.
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      logger.audit(`generate-recommendations [ReqId: ${requestId}]`, 'anonymous', false, { error: authResult.error });
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiting check
    const rateLimitKey = `generate-recommendations:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 5, 60000)) {
      logger.warn(`[Generate Recommendations API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    // --- 1. PARSE & VALIDATE INPUT ---
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      academicStream: searchParams.get('academicStream'),
      skills: searchParams.get('skills') || '',
      interests: searchParams.get('interests') || '',
      cNum1: searchParams.get('cNum1'),
      cNum2: searchParams.get('cNum2'),
      cAns: searchParams.get('cAns'),
    };

    const result = generateRecommendationsSchema.safeParse(queryData);
    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      logger.warn(`[Generate Recommendations API] [ReqId: ${requestId}] Validation failed: ${errorMsg}`);
      return errorResponse(errorMsg, 400);
    }

    const { academicStream, skills, interests, cNum1, cNum2, cAns } = result.data;

    // Verify security check
    if (cNum1 + cNum2 !== cAns) {
      logger.warn(`[Generate Recommendations API] [ReqId: ${requestId}] CAPTCHA verification failed`);
      return errorResponse('Security check failed. Please verify CAPTCHA.', 400);
    }

    // Check and load dynamic profile context
    let activeStream = academicStream;
    let activeSkills = skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
    let activeInterests = interests ? interests.split(',').map((s) => s.trim()).filter(Boolean) : [];

    if (userId !== 'anonymous') {
      const userContext = await contextBuilder.getCareerAIContext(userId);
      if (userContext) {
        // If preferred roles are completely missing, ask the user progressively
        if (!userContext.preferredRoles || userContext.preferredRoles.length === 0) {
          return successResponse({
            missingFields: ['careerGoals.preferredRoles'],
            question: 'What professional role(s) are you targeting?'
          });
        }
        
        if (userContext.academicStream) activeStream = userContext.academicStream;
        if (userContext.skills.length > 0) activeSkills = userContext.skills;
        if (userContext.interests.length > 0) activeInterests = userContext.interests;
      }
    }

    const isGenerateMore = searchParams.get('generateMore') === 'true';

    logger.info(`[Generate Recommendations API] [ReqId: ${requestId}] Generating recommendations for user: ${userId}`, {
      academicStream: activeStream,
      skillsCount: activeSkills.length,
      interestsCount: activeInterests.length,
      generateMore: isGenerateMore
    });

    const aiRes = await careerAi.generateRecommendations(activeStream, activeSkills, activeInterests, isGenerateMore);
    const latency = Date.now() - start;

    logger.info(`[Generate Recommendations API] [ReqId: ${requestId}] Completed successfully in ${latency}ms`);

    return successResponse(aiRes.data);

  } catch (error) {
    logger.error(`[Generate Recommendations API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("Error generating recommendations.", 500);
  }
}
