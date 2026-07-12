import crypto from 'crypto';
import { aiService, StandardAiResponse } from '../aiService';
import { getResumeHelperPrompt, getResumeAnalyzerPrompt } from '../prompts/resume';
import { cacheStore } from '@/lib/cache';
import { logger } from '@/services/logger';

export function getFallbackResumeAnalysis() {
  return {
    atsScore: 70,
    bullets: [
      {
        original: 'Responsible for coding web apps',
        rating: 'weak' as const,
        suggestion: 'Use strong action verbs and specify key technologies used.',
        rewritten: 'Designed and engineered responsive React/Next.js client applications, improving rendering metrics.',
      },
    ],
    missingSkills: ['TypeScript', 'Next.js', 'Jest'],
    suggestedProjects: [
      'E-commerce SaaS platform utilizing Next.js and Firebase',
      'Unified developer portfolio workspace with analytics dashboard',
    ],
    professionalSummary: 'Detail-oriented developer with foundations in programming and web applications development, looking to optimize systems and developer workflows.',
    overallFeedback: 'Your resume shows a strong technical foundation. Optimize the impact by incorporating specific metrics and standard framework keywords.',
  };
}

export function getFallbackResumeHelperPoints() {
  return `
* Designed, built, and optimized scalable web services and client-side applications.
* Maintained clean database models and structured queries to optimize performance metrics.
* Collaborated with team members to deliver responsive and ATS-optimized applications.
`.trim();
}

/**
 * Resume AI Business Domain Module
 */
export class ResumeAi {
  async optimizeResumeStream(skills: string[], jobDescription: string): Promise<ReadableStream<string>> {
    const prompt = getResumeHelperPrompt(skills, jobDescription);
    const fallbackText = getFallbackResumeHelperPoints();

    return await aiService.generateStream(prompt, fallbackText);
  }

  async analyzeResume(resumeText: string, targetCareer?: string): Promise<StandardAiResponse<any>> {
    const hash = crypto.createHash('md5').update(resumeText).digest('hex');
    const cacheKey = `resume-analysis:${hash}:${targetCareer || ''}`;

    try {
      const cached = await cacheStore.get<any>(cacheKey);
      if (cached) {
        logger.info(`[ResumeAi] Cache hit for resume analysis key: ${cacheKey}`);
        return {
          success: true,
          provider: 'cache',
          model: 'in-memory',
          latency: 0,
          data: cached,
          warnings: [],
        };
      }
    } catch (err) {
      logger.error('[ResumeAi] Cache read failed', err);
    }

    const prompt = getResumeAnalyzerPrompt(resumeText, targetCareer);
    const fallback = getFallbackResumeAnalysis();

    const res = await aiService.generateJSON(prompt, fallback);

    if (res.success && res.provider !== 'mock') {
      try {
        await cacheStore.set(cacheKey, res.data, 1800); // 30 minutes TTL
      } catch (err) {
        logger.error('[ResumeAi] Cache write failed', err);
      }
    }

    return res;
  }
}

export const resumeAi = new ResumeAi();
