import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/resume-analyzer
 * Accepts resume text (extracted client-side) and target career,
 * sends to Gemini for comprehensive analysis.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { resumeText, targetCareer } = body;

        if (!resumeText || resumeText.trim().length < 50) {
            return new Response(
                JSON.stringify({ error: 'Please provide resume text (minimum 50 characters)' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const prompt = `
      You are an expert ATS (Applicant Tracking System) resume analyst and career coach.
      Analyze the following resume${targetCareer ? ` for a "${targetCareer}" position` : ''}.

      Your ENTIRE response must be a single valid JSON object with this exact structure:
      {
        "atsScore": 72,
        "bullets": [
          {
            "original": "The original bullet point from the resume",
            "rating": "weak",
            "suggestion": "Why it's weak and how to improve it",
            "rewritten": "A better version of the bullet point"
          }
        ],
        "missingSkills": ["skill1", "skill2"],
        "suggestedProjects": ["Project idea 1 with brief description", "Project idea 2"],
        "professionalSummary": "A rewritten professional summary",
        "overallFeedback": "2-3 sentence overall assessment"
      }

      Rules:
      - atsScore: 0-100 based on ATS-friendliness (keywords, formatting, action verbs)
      - bullets: Analyze the top 5-8 most important bullet points. Rating can be "weak", "average", or "strong"
      - missingSkills: 3-5 skills that would strengthen the resume${targetCareer ? ` for ${targetCareer}` : ''}
      - suggestedProjects: 2-3 specific project ideas to add
      - professionalSummary: A compelling 2-3 sentence professional summary
      - Do NOT include markdown or text outside JSON

      Resume:
      ${resumeText}
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
        console.error('Error in resume-analyzer API route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error analyzing resume.';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
