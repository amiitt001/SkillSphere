import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { chatbotAi } from '@/services/ai';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { chatbotSchema } from '@/lib/validation';
import { globalRateLimiter } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      logger.auth(undefined, `chatbot [ReqId: ${requestId}]`, false, authResult.error);
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const userId = authResult.user?.uid || 'anonymous';

    // Rate limiting check
    const rateLimitKey = `chatbot:${userId}`;
    if (!globalRateLimiter.check(rateLimitKey, 10, 60000)) {
      logger.warn(`[Chatbot API] [ReqId: ${requestId}] Rate limit exceeded for user: ${userId}`);
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await req.json();
    const result = chatbotSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      logger.warn(`[Chatbot API] [ReqId: ${requestId}] Validation failed: ${errorMsg}`);
      return errorResponse(errorMsg, 400);
    }

    const { message, userName } = result.data;

    logger.info(`[Chatbot API] [ReqId: ${requestId}] Generating response for user: ${userId}`, {
      userName,
      messageLength: message.length,
    });

    const aiRes = await chatbotAi.respond(userName || 'User', message);
    const latency = Date.now() - start;

    logger.info(`[Chatbot API] [ReqId: ${requestId}] Completed successfully in ${latency}ms`);

    return successResponse({
      response: aiRes.data,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error(`[Chatbot API] [ReqId: ${requestId}] Unhandled error:`, error);
    return errorResponse("I'm experiencing technical difficulties. Please try again in a moment.", 500);
  }
}
