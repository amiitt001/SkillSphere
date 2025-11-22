import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Handles the GET request to generate career recommendations in a Next.js App Router environment.
 * This is the definitive, final version, using the correct model per Google's error logs.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const academicStream = searchParams.get('academicStream') || '';
    const skills = searchParams.get('skills') || '';
    const interests = searchParams.get('interests') || '';

    const prompt = `
      You are an expert career and skills advisor. Your task is to provide personalized career path recommendations for a user in India.
      Your entire response MUST be a single, valid JSON object. Do not include any text, markdown formatting, or notes before or after the JSON object.

      The JSON object should have a single key "recommendations", which is an array of 3 career path objects.
      Each career path object must have the following keys:
      - "title": The name of the career path (e.g., "AI/Machine Learning Engineer").
      - "justification": A concise, one-sentence explanation of why it's a good fit for the user.
      - "roadmap": An array of 3-4 strings, with each string being a short, actionable step.
      - "estimatedSalary": A typical annual salary range in India (e.g., "₹8,00,000 - ₹15,00,000 LPA").
      - "suggestedCertifications": An array of 2-3 relevant professional certifications.
      - "keyCompanies": An array of 2-3 notable companies in India that hire for this role.

      User's Profile:
      - Academic Stream: ${academicStream}
      - Skills: ${skills}
      - Interests: ${interests}
    `;

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    // THE FIX: Using the v1beta endpoint and the most compatible 'latest' model.
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error from Google AI API:", errorText);
      return new Response(errorText, { status: response.status });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Invalid response structure from AI API");
    }

    // Clean the response to ensure it's valid JSON
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanedText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error("Error in generate-recommendations API route:", error);
    const errorMessage = error instanceof Error ? error.message : "Error generating recommendation.";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}

