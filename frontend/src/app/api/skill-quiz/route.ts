import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/skill-quiz
 * Generates quiz questions based on selected skills and difficulty level.
 * Supports adaptive difficulty with previous answers context.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { skills, difficulty = 'intermediate', questionCount = 10 } = body;

        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Please provide at least one skill to assess' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const prompt = `
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
    `;

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY is not defined');
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from Google AI API:', errorText);
            return new Response(errorText, { status: response.status });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Invalid response structure from AI API');
        }

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return new Response(cleanedText, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: unknown) {
        console.error('Error in skill-quiz API route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error generating quiz.';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
