import { type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { careerAi } from '@/services/ai';
import { logger } from '@/services/logger';
import { errorResponse } from '@/utils';
import { compareCareersSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Handles the GET request to generate a career comparison.
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      logger.auth(undefined, `compare-careers [ReqId: ${requestId}]`, false, authResult.error);
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiting check
    const rateLimitKey = `compare-careers:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 5, 60000)) {
      logger.warn(`[Compare Careers API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    // --- 1. PARSE & VALIDATE USER INPUT ---
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      career1: searchParams.get('career1'),
      career2: searchParams.get('career2'),
    };

    const result = compareCareersSchema.safeParse(queryData);
    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      logger.warn(`[Compare Careers API] [ReqId: ${requestId}] Validation failed: ${errorMsg}`);
      return errorResponse(errorMsg, 400);
    }

    const { career1, career2 } = result.data;

    logger.info(`[Compare Careers API] [ReqId: ${requestId}] Generating comparison stream for user: ${userId}`, {
      career1,
      career2,
    });

    const rawStream = await careerAi.compareCareersStream(career1, career2);
    
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
          logger.info(`[Compare Careers API] [ReqId: ${requestId}] Stream completed successfully in ${latency}ms`);
        } catch (streamErr) {
          logger.error(`[Compare Careers API] [ReqId: ${requestId}] Streaming error:`, streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(encodedStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    logger.error(`[Compare Careers API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("Error generating comparison.", 500);
  }
}
