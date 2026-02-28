import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/skill-quiz/evaluate
 * Evaluates quiz answers and generates detailed skill analysis.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { questions, answers } = body;

        if (!questions || !answers || questions.length !== answers.length) {
            return new Response(
                JSON.stringify({ error: 'Invalid quiz data' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Calculate scores per skill
        const skillMap: Record<string, { correct: number; total: number }> = {};

        questions.forEach((q: { skill: string; correctAnswer: number }, i: number) => {
            if (!skillMap[q.skill]) {
                skillMap[q.skill] = { correct: 0, total: 0 };
            }
            skillMap[q.skill].total++;
            if (answers[i] === q.correctAnswer) {
                skillMap[q.skill].correct++;
            }
        });

        const scores = Object.entries(skillMap).map(([skill, data]) => {
            const score = Math.round((data.correct / data.total) * 100);
            let level: 'weak' | 'average' | 'strong' | 'expert' = 'weak';
            if (score >= 90) level = 'expert';
            else if (score >= 70) level = 'strong';
            else if (score >= 50) level = 'average';
            return { skill, score, maxScore: 100, level };
        });

        const overallCorrect = answers.reduce((acc: number, ans: number, i: number) => {
            return acc + (ans === questions[i].correctAnswer ? 1 : 0);
        }, 0);
        const overallScore = Math.round((overallCorrect / questions.length) * 100);

        const weakAreas = scores.filter((s) => s.level === 'weak' || s.level === 'average').map((s) => s.skill);
        const strongAreas = scores.filter((s) => s.level === 'strong' || s.level === 'expert').map((s) => s.skill);

        // Get AI-powered recommendations for improvement
        const prompt = `
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
    `;

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY is not defined');
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

        const aiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        let recommendations: string[] = ['Focus on practicing the topics in your weak areas.'];

        if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiText) {
                try {
                    const cleaned = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
                    const parsed = JSON.parse(cleaned);
                    recommendations = parsed.recommendations || recommendations;
                } catch {
                    // Use default recommendations if parsing fails
                }
            }
        }

        const result = {
            scores,
            overallScore,
            weakAreas,
            strongAreas,
            recommendations,
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: unknown) {
        console.error('Error in skill-quiz/evaluate API route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error evaluating quiz.';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
