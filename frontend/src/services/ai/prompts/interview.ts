/**
 * Interview Prompts Library
 */

export const getInterviewGenerationPrompt = (career: string, companyType: string, experienceLevel: string) => `
You are an expert interview coach specializing in ${career} roles.
Generate interview questions for a ${experienceLevel} candidate applying at a ${companyType} company.

Your ENTIRE response must be a valid JSON object:
{
  "questions": [
    {
      "id": "t1",
      "question": "The question text",
      "type": "technical",
      "difficulty": "medium",
      "expectedPoints": ["Point 1 they should cover", "Point 2", "Point 3"],
      "sampleAnswer": "A brief sample answer"
    }
  ]
}

Generate:
- 4 technical questions
- 3 behavioral questions (use STAR method framework)
- 2 coding/problem-solving questions

Rules:
- type: "technical", "behavioral", or "coding"
- difficulty: "easy", "medium", or "hard"
- expectedPoints: 3-4 key points the answer should cover
- sampleAnswer: A concise but comprehensive answer
- Questions should be realistic for the specified company type and level
- Do NOT include markdown or text outside JSON
`.trim();

export const getInterviewEvaluationPrompt = (
  career: string,
  companyType: string,
  question: string,
  answer: string
) => `
You are an expert interview coach. Evaluate the following interview answer.

Career: ${career}
Company type: ${companyType}
Question: ${question}
User's Answer: ${answer}

Your ENTIRE response must be a valid JSON object:
{
  "structureScore": 75,
  "clarityScore": 80,
  "technicalScore": 70,
  "overallScore": 75,
  "strengths": ["Good use of examples", "Clear structure"],
  "improvements": ["Add more technical depth", "Use STAR method"],
  "revisedAnswer": "A better version of their answer"
}

Rules:
- Scores are 0-100
- Be constructive but honest
- Provide 2-3 strengths and 2-3 improvements
- The revised answer should be concise but comprehensive
- Do NOT include markdown or text outside JSON
`.trim();
