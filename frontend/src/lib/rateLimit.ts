import { logger } from '@/services/logger';

/**
 * Reusable In-Memory Rate Limiter
 */
export class RateLimiter {
  private map = new Map<string, { count: number; resetTime: number }>();

  /**
   * Evaluates if a given key is under the rate limit.
   * @param key Identifer (e.g. IP address or user ID) concatenated with feature prefix.
   * @param limit Maximum allowed requests in the window.
   * @param windowMs Time window in milliseconds.
   * @returns true if allowed, false if limit exceeded.
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.map.get(key);

    if (!record || now > record.resetTime) {
      this.map.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      logger.warn(`[RateLimiter] Limit exceeded for key: ${key}. Count: ${record.count}, Limit: ${limit}`);
      return false;
    }

    record.count++;
    return true;
  }
}

export const globalRateLimiter = new RateLimiter();
export default globalRateLimiter;
