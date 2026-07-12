/**
 * Quiz Prompts Library
 */

export const getQuizGenerationPrompt = (skills: string[], difficulty: string, questionCount: number) => `
You are an expert skill assessment engine. Generate exactly ${questionCount} multiple-choice quiz questions to assess a user's proficiency in the following skills: ${skills.join(', ')}.

Difficulty level: ${difficulty}

Your ENTIRE response must be a single valid JSON object with this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "skill": "Which skill this tests",
      "difficulty": "${difficulty}"
    }
  ]
}

Rules:
- Generate exactly ${questionCount} questions
- Distribute questions across all provided skills evenly
- Each question must have exactly 4 options
- correctAnswer is the 0-based index of the correct option
- Questions should be practical and test real-world understanding
- Include a mix of conceptual, practical, and scenario-based questions
- Do NOT include any markdown or text outside the JSON
`.trim();

export const getQuizEvaluationPrompt = (
  overallScore: number,
  weakAreas: string[],
  strongAreas: string[],
  scores: { skill: string; score: number }[]
) => `
A user completed a skill assessment quiz with these results:
- Overall Score: ${overallScore}%
- Weak areas: ${weakAreas.join(', ') || 'None'}
- Strong areas: ${strongAreas.join(', ') || 'None'}
- Detailed scores: ${scores.map((s) => `${s.skill}: ${s.score}%`).join(', ')}

Provide 3-5 specific, actionable learning recommendations to improve their weak areas.
Your ENTIRE response must be a valid JSON object:
{
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}
`.trim();
