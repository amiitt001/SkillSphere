import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/interview-prep
 * Generates interview questions based on career, company type, and experience level.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { career, companyType = 'MNC', experienceLevel = 'fresher', action } = body;

        if (!career) {
            return new Response(
                JSON.stringify({ error: 'Please provide a target career' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // If action is 'evaluate', evaluate a user's answer
        if (action === 'evaluate') {
            const { question, answer } = body;
            if (!question || !answer) {
                return new Response(
                    JSON.stringify({ error: 'Please provide both question and answer' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const evalPrompt = `
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
      `;

            const API_KEY = process.env.GEMINI_API_KEY;
            if (!API_KEY) throw new Error('GEMINI_API_KEY is not defined');

            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
            const evalResponse = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: evalPrompt }] }] }),
            });

            if (!evalResponse.ok) {
                const errorText = await evalResponse.text();
                return new Response(errorText, { status: evalResponse.status });
            }

            const evalData = await evalResponse.json();
            const evalText = evalData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!evalText) throw new Error('Invalid AI response');

            const cleanedEval = evalText.replace(/```json/g, '').replace(/```/g, '').trim();
            return new Response(cleanedEval, {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Generate interview questions
        const prompt = `
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
    `;

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) throw new Error('GEMINI_API_KEY is not defined');

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return new Response(errorText, { status: response.status });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Invalid AI response');

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return new Response(cleanedText, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: unknown) {
        console.error('Error in interview-prep API route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error generating interview prep.';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
