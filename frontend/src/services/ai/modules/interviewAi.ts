import { aiService, StandardAiResponse } from '../aiService';
import { getInterviewGenerationPrompt, getInterviewEvaluationPrompt } from '../prompts/interview';

export function getFallbackQuestions(career: string) {
  return {
    questions: [
      {
        id: 't1',
        question: `Explain the core responsibilities and modern tooling associated with a ${career} role.`,
        type: 'technical' as const,
        difficulty: 'medium' as const,
        expectedPoints: ['Key responsibilities', 'Common framework tools', 'Version control best practices'],
        sampleAnswer: 'A developer in this role focuses on scaling architectures, writing clean code, and deploying integrations.',
      },
      {
        id: 'b1',
        question: 'Describe a time you solved a challenging technical issue. Use the STAR method.',
        type: 'behavioral' as const,
        difficulty: 'medium' as const,
        expectedPoints: ['Situation background', 'Task details', 'Action taken', 'Result metrics'],
        sampleAnswer: 'I identified a query bottleneck, refactored indices, and improved search response time by 40%.',
      },
    ],
  };
}

export function getFallbackEvaluation() {
  return {
    structureScore: 70,
    clarityScore: 75,
    technicalScore: 70,
    overallScore: 72,
    strengths: ['Clear response structure', 'Good language flow'],
    improvements: ['Incorporate specific technical metrics', 'Explain architectural tradeoffs'],
    revisedAnswer: 'The corrected response should explicitly highlight architectural decisions and tech stacks used.',
  };
}

/**
 * Interview AI Business Domain Module
 */
export class InterviewAi {
  async generateQuestions(
    career: string,
    companyType: string,
    experienceLevel: string
  ): Promise<StandardAiResponse<any>> {
    const prompt = getInterviewGenerationPrompt(career, companyType, experienceLevel);
    const fallback = getFallbackQuestions(career);

    return await aiService.generateJSON(prompt, fallback);
  }

  async evaluateAnswer(
    career: string,
    companyType: string,
    question: string,
    answer: string
  ): Promise<StandardAiResponse<any>> {
    const prompt = getInterviewEvaluationPrompt(career, companyType, question, answer);
    const fallback = getFallbackEvaluation();

    return await aiService.generateJSON(prompt, fallback);
  }
}

export const interviewAi = new InterviewAi();
