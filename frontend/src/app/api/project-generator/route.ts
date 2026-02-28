import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/project-generator
 * Generates AI-powered project ideas based on target career, skill level, and existing skills.
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const career = searchParams.get('career') || '';
        const skillLevel = searchParams.get('skillLevel') || 'intermediate';
        const skills = searchParams.get('skills') || '';

        if (!career) {
            return new Response(
                JSON.stringify({ error: 'Please provide a target career' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const prompt = `
      You are an expert software engineering mentor and project advisor.
      Generate 3 portfolio project ideas for someone targeting a "${career}" career.

      User's skill level: ${skillLevel}
      ${skills ? `User's existing skills: ${skills}` : ''}

      Your ENTIRE response must be a single valid JSON object:
      {
        "projects": [
          {
            "title": "Project Title",
            "description": "2-3 sentence description of what the project does and why it's impressive",
            "techStack": ["React", "Node.js", "MongoDB"],
            "architecture": "Brief system architecture description (microservices, monolith, etc.)",
            "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
            "resumeDescription": "A powerful 2-line resume bullet point for this project",
            "folderStructure": "project-name/\\n├── src/\\n│   ├── components/\\n│   ├── pages/\\n│   └── utils/\\n├── server/\\n│   ├── routes/\\n│   └── models/\\n├── package.json\\n└── README.md",
            "difficulty": "${skillLevel}",
            "estimatedTime": "2-3 weeks"
          }
        ]
      }

      Rules:
      - Generate exactly 3 projects
      - Projects should be progressively more complex
      - Each project should be genuinely impressive on a resume
      - Tech stacks should be modern and industry-relevant
      - Features should be specific and implementable
      - Folder structure should use ├── and └── characters
      - Resume descriptions should use strong action verbs
      - Do NOT include markdown or text outside JSON
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
        console.error('Error in project-generator API route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error generating projects.';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
