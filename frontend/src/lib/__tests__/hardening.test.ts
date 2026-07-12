import { chatbotSchema, compareCareersSchema, generateRecommendationsSchema } from '../validation';
import { RateLimiter } from '../rateLimit';
import { MemoryCacheStore } from '../cache';

describe('Production Hardening & Security Utilities', () => {
  
  describe('Zod Request Schema Validation', () => {
    
    it('should validate valid chatbot message', () => {
      const parsed = chatbotSchema.safeParse({ message: 'Hello AI' });
      expect(parsed.success).toBe(true);
    });

    it('should reject empty or missing chatbot message', () => {
      const parsed = chatbotSchema.safeParse({ message: '' });
      expect(parsed.success).toBe(false);
    });

    it('should validate valid careers comparison inputs', () => {
      const parsed = compareCareersSchema.safeParse({
        career1: 'Software Engineer',
        career2: 'Data Scientist',
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject invalid recommendations schemas', () => {
      const parsed = generateRecommendationsSchema.safeParse({
        academicStream: '',
        cNum1: 1,
        cNum2: 2,
        cAns: 3,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('Rate Limiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter();
    });

    it('should allow requests within limit', () => {
      const key = 'test-key';
      expect(rateLimiter.check(key, 2, 1000)).toBe(true);
      expect(rateLimiter.check(key, 2, 1000)).toBe(true);
    });

    it('should reject requests exceeding limit', () => {
      const key = 'test-key-limit';
      expect(rateLimiter.check(key, 2, 1000)).toBe(true);
      expect(rateLimiter.check(key, 2, 1000)).toBe(true);
      expect(rateLimiter.check(key, 2, 1000)).toBe(false);
    });

    it('should reset limits after window expiration', async () => {
      const key = 'test-key-expiry';
      expect(rateLimiter.check(key, 1, 50)).toBe(true);
      expect(rateLimiter.check(key, 1, 50)).toBe(false);
      
      // Wait for window expiration
      await new Promise((resolve) => setTimeout(resolve, 60));
      
      expect(rateLimiter.check(key, 1, 50)).toBe(true);
    });
  });

  describe('In-Memory Response Caching', () => {
    let cacheStore: MemoryCacheStore;

    beforeEach(() => {
      cacheStore = new MemoryCacheStore();
    });

    it('should retrieve set cache value within TTL', async () => {
      const key = 'cache-key';
      const data = { recommendations: ['Career A'] };
      
      await cacheStore.set(key, data, 10);
      const cached = await cacheStore.get(key);
      
      expect(cached).toEqual(data);
    });

    it('should return null for expired cache keys', async () => {
      const key = 'cache-key-expire';
      const data = { quiz: 'Sample Questions' };
      
      await cacheStore.set(key, data, 0.05); // 50ms TTL
      
      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 60));
      
      const cached = await cacheStore.get(key);
      expect(cached).toBeNull();
    });
  });
});
