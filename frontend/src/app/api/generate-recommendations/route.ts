import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { careerAi, CareerRecommendationContext } from '@/services/ai';
import { computeCareerProfileHash } from '@/services/ai';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { generateRecommendationsSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';
import { contextBuilder } from '@/services/onboarding/contextBuilder';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';

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

    const { cNum1, cNum2, cAns } = result.data;

    // Verify security check
    if (cNum1 + cNum2 !== cAns) {
      logger.warn(`[Generate Recommendations API] [ReqId: ${requestId}] CAPTCHA verification failed`);
      return errorResponse('Security check failed. Please verify CAPTCHA.', 400);
    }

    // --- 2. BUILD PERSONALIZED CONTEXT FROM UNIFIED PROFILE ---
    const db = getFirestore();
    const [userContext, userDocSnap] = await Promise.all([
      contextBuilder.getCareerAIContext(userId),
      db.collection('users').doc(userId).get(),
    ]);

    if (!userContext?.profile) {
      return errorResponse('Unified profile not found. Please complete your profile or upload your resume first.', 400);
    }

    const resumeFilename = userDocSnap.data()?.currentResumeFilename || 'unknown';
    const profileHash = computeCareerProfileHash({
      userId,
      academicStream: userContext.academicStream,
      skills: userContext.skills,
      certifications: userContext.certifications,
      interests: userContext.interests,
      preferredRoles: userContext.preferredRoles,
      experience: userContext.experience,
      projects: userContext.projects,
      education: userContext.education,
      profileVersion: userContext.profileVersion,
    });

    const activeStream = userContext.academicStream;
    const activeSkills = userContext.skills;
    const activeCertifications = userContext.certifications;
    const activeInterests = userContext.interests;
    const activeRoles = userContext.preferredRoles;
    const activeExperience = userContext.experience;
    const activeProjects = userContext.projects;
    const activeEducation = userContext.education;
    const profileVersion = userContext.profileVersion;

    const isGenerateMore = searchParams.get('generateMore') === 'true';

    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[Generate Recommendations API] [ReqId: ${requestId}] Development profile snapshot`, {
        resumeFilename,
        profileVersion,
        profileHash,
        parsedSkills: activeSkills,
        parsedExperience: activeExperience,
      });
    }

    logger.info(`[Generate Recommendations API] [ReqId: ${requestId}] Generating recommendations for user: ${userId}`, {
      academicStream: activeStream,
      skillsCount: activeSkills.length,
      certificationsCount: activeCertifications.length,
      interestsCount: activeInterests.length,
      experienceCount: activeExperience.length,
      projectsCount: activeProjects.length,
      generateMore: isGenerateMore
    });

    // --- 3. BUILD FULL CONTEXT AND CALL AI ---
    const recommendationContext: CareerRecommendationContext = {
      userId,
      academicStream: activeStream,
      skills: activeSkills,
      certifications: activeCertifications,
      interests: activeInterests,
      preferredRoles: activeRoles,
      experience: activeExperience,
      projects: activeProjects,
      education: activeEducation,
      profileVersion,
      profileHash,
    };

    const aiRes = await careerAi.generateRecommendations(recommendationContext, isGenerateMore);
    const latency = Date.now() - start;

    logger.info(`[Generate Recommendations API] [ReqId: ${requestId}] Completed successfully in ${latency}ms`);

    return successResponse(aiRes.data);

  } catch (error) {
    logger.error(`[Generate Recommendations API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("Error generating recommendations.", 500);
  }
}
