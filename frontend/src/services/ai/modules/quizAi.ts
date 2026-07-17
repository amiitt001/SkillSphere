import { modelRouter as aiService } from '../orchestrator/modelRouter';
import { StandardAiResponse } from '../aiService';
import { getQuizGenerationPrompt, getQuizEvaluationPrompt } from '../prompts/quiz';
import { cacheProvider } from '@/shared/infrastructure/cache/cacheProvider';
import { logger } from '@/services/logger';

export function getFallbackQuiz(skills: string[]) {
  return {
    questions: [
      {
        id: 'q1',
        question: `Which of the following is a primary concept or practice in ${skills[0] || 'software development'}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'This option represents standard industry practice.',
        skill: skills[0] || 'general',
        difficulty: 'intermediate',
      },
    ],
  };
}

export function getFallbackQuizEvaluation() {
  return {
    recommendations: [
      'Review core documentation and practice fundamental programming exercises.',
      'Work on hands-on portfolio integration projects.',
      'Read advanced articles on performance and software design.',
    ],
  };
}

/**
 * Quiz AI Business Domain Module
 */
export class QuizAi {
  async generateQuiz(
    skills: string[],
    difficulty: string,
    questionCount: number
  ): Promise<StandardAiResponse<any>> {
    const skillsStr = skills.map((s) => s.trim()).sort().join(',');
    const cacheKey = `quiz:${skillsStr}:${difficulty}:${questionCount}`;

    try {
      const cached = await cacheProvider.get<any>(cacheKey);
      if (cached) {
        logger.info(`[QuizAi] Cache hit for quiz generation key: ${cacheKey}`);
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
      logger.error('[QuizAi] Cache read failed', err);
    }

    const prompt = getQuizGenerationPrompt(skills, difficulty, questionCount);
    const fallback = getFallbackQuiz(skills);

    const res = await aiService.generateJSON(prompt, fallback);

    if (res.success && res.provider !== 'mock') {
      try {
        await cacheProvider.set(cacheKey, res.data, 1800); // 30 minutes TTL
      } catch (err) {
        logger.error('[QuizAi] Cache write failed', err);
      }
    }

    return res;
  }

  async evaluateQuiz(
    overallScore: number,
    weakAreas: string[],
    strongAreas: string[],
    scores: { skill: string; score: number }[]
  ): Promise<StandardAiResponse<any>> {
    const prompt = getQuizEvaluationPrompt(overallScore, weakAreas, strongAreas, scores);
    const fallback = getFallbackQuizEvaluation();

    return await aiService.generateJSON(prompt, fallback);
  }
}

export const quizAi = new QuizAi();
