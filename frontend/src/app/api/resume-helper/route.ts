import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { resumeAi } from '@/services/ai';
import { logger } from '@/services/logger';
import { errorResponse } from '@/utils';
import { resumeHelperSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Handles the POST request to generate resume bullet points.
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      logger.audit(`resume-helper [ReqId: ${requestId}]`, 'anonymous', false, { error: authResult.error });
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiting check
    const rateLimitKey = `resume-helper:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 5, 60000)) {
      logger.warn(`[Resume Helper API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    // --- 1. PARSE & VALIDATE USER INPUT ---
    const body = await request.json();
    const result = resumeHelperSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      logger.warn(`[Resume Helper API] [ReqId: ${requestId}] Validation failed: ${errorMsg}`);
      return errorResponse(errorMsg, 400);
    }

    const { skills, jobDescription, cNum1, cNum2, cAns } = result.data;

    // Server-side CAPTCHA verification
    if (cNum1 + cNum2 !== cAns) {
      logger.warn(`[Resume Helper API] [ReqId: ${requestId}] CAPTCHA verification failed`);
      return errorResponse('Security check failed. Please verify CAPTCHA.', 400);
    }

    logger.info(`[Resume Helper API] [ReqId: ${requestId}] Generating optimized bullets stream for user: ${userId}`, {
      skillsCount: skills.length,
      jobDescriptionLength: jobDescription.length,
    });

    const rawStream = await resumeAi.optimizeResumeStream(skills, jobDescription);

    // Transform string stream into encoded Uint8Array stream
    const encoder = new TextEncoder();
    const encodedStream = new ReadableStream({
      async start(controller) {
        const reader = rawStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(encoder.encode(value));
          }
          controller.close();
          const latency = Date.now() - start;
          logger.info(`[Resume Helper API] [ReqId: ${requestId}] Stream completed successfully in ${latency}ms`);
        } catch (streamErr) {
          logger.error(`[Resume Helper API] [ReqId: ${requestId}] Streaming error:`, streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(encodedStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    logger.error(`[Resume Helper API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("Error optimizing resume.", 500);
  }
}
